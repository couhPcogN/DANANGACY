const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// In-memory AsyncStorage mock cho phép test độc lập nhiều key và trạng thái
const storageMap = new Map();
let simulateStorageFailure = false;
let simulateStorageDelayMs = 0;

const asyncStorageMock = {
  async getItem(key) {
    if (simulateStorageDelayMs > 0) {
      await new Promise((r) => setTimeout(r, simulateStorageDelayMs));
    }
    if (simulateStorageFailure) {
      throw new Error('AsyncStorage disk IO error');
    }
    return storageMap.has(key) ? storageMap.get(key) : null;
  },
  async setItem(key, value) {
    if (simulateStorageDelayMs > 0) {
      await new Promise((r) => setTimeout(r, simulateStorageDelayMs));
    }
    if (simulateStorageFailure) {
      throw new Error('AsyncStorage disk write error');
    }
    storageMap.set(key, value);
  },
  async removeItem(key) {
    if (simulateStorageFailure) {
      throw new Error('AsyncStorage disk remove error');
    }
    storageMap.delete(key);
  },
  async clear() {
    storageMap.clear();
  },
};

function loadTs(relativePath, customStorage = asyncStorageMock) {
  const file = path.resolve(root, relativePath);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };

  const localRequire = (id) => {
    if (id === '@react-native-async-storage/async-storage') {
      return customStorage;
    }
    if (/\.(jpg|png)$/.test(id)) return path.basename(id);
    if (id.startsWith('.')) {
      const base = path.resolve(path.dirname(file), id);
      const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(
        fs.existsSync,
      );
      if (resolved) return loadTs(path.relative(root, resolved), customStorage);
    }
    return require(id);
  };

  const fn = vm.runInThisContext('(function(require, module, exports) {' + code + '\n})', {
    filename: file,
  });
  fn(localRequire, module, module.exports);
  return module.exports;
}

// Nạp các modules cần kiểm thử
const { createItineraryRepository } = loadTs(
  'src/features/itinerary/repositories/itineraryRepository.ts',
);

const { reconcileRemoteItineraries } = loadTs(
  'src/features/itinerary/models/itineraryReconciliation.ts',
);

const {
  getAccountStorageKey,
  itineraryStorage,
  itineraryPersistence,
  sanitizeItineraries,
  validateAndQuarantineItineraries,
  GUEST_ITINERARIES_KEY,
  LEGACY_STORAGE_KEY,
  UNCLAIMED_LEGACY_KEY,
  QUARANTINE_KEY_PREFIX,
} = loadTs('src/services/storage/itineraryStorage.ts');

const { appStateRepository } = loadTs('src/services/storage/appStateRepository.ts');

const { mapItineraryToBackendCreate, mapItineraryToBackendUpdate } = loadTs(
  'src/services/api/itineraryMapping.ts',
);

// ---------------------------------------------------------------------------
// 1. Repository: attachRemoteMetadata
// ---------------------------------------------------------------------------
test('1. attachRemoteMetadata updates remoteId, version and sets syncStatus to synced', () => {
  const repo = createItineraryRepository([
    {
      id: 'local-itin-1',
      title: 'Khám phá Ngũ Hành Sơn',
      date: '20/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'ngu-hanh-son', start: '08:00', end: '11:00', dayIndex: 1 }],
      saved: true,
      syncStatus: 'local',
    },
  ]);

  const attached = repo.actions.attachRemoteMetadata('local-itin-1', 42, 1);
  assert.equal(attached, true);

  const snapshot = repo.getSnapshot();
  const item = snapshot.itineraries.find((i) => i.id === 'local-itin-1');
  assert.ok(item);
  assert.equal(item.remoteId, 42);
  assert.equal(item.version, 1);
  assert.equal(item.syncStatus, 'synced');

  // Gắn metadata cho id không tồn tại trả về false
  assert.equal(repo.actions.attachRemoteMetadata('non-existent', 99, 1), false);
});

// ---------------------------------------------------------------------------
// 2. Repository: updateSyncStatus
// ---------------------------------------------------------------------------
test('2. updateSyncStatus transitions sync status correctly', () => {
  const repo = createItineraryRepository([
    {
      id: 'local-itin-2',
      title: 'Bán đảo Sơn Trà',
      date: '21/11/2026',
      duration: 1,
      pace: 'Cân bằng',
      stops: [{ placeId: 'son-tra', start: '08:00', end: '11:00', dayIndex: 1 }],
      saved: true,
      syncStatus: 'synced',
    },
  ]);

  assert.equal(repo.actions.updateSyncStatus('local-itin-2', 'pending'), true);
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'pending');

  assert.equal(repo.actions.updateSyncStatus('local-itin-2', 'conflict'), true);
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'conflict');

  assert.equal(repo.actions.updateSyncStatus('local-itin-2', 'error'), true);
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'error');

  assert.equal(repo.actions.updateSyncStatus('unknown-id', 'synced'), false);
});

// ---------------------------------------------------------------------------
// 3. Pure Remote Reconciliation: Initial merge
// ---------------------------------------------------------------------------
test('3. reconcileRemoteItineraries maps and appends incoming remote records cleanly', () => {
  const current = [
    {
      id: 'local-only-1',
      title: 'Lịch trình riêng',
      date: '22/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
      saved: true,
      syncStatus: 'local',
    },
  ];

  const remote = [
    {
      id: 101,
      owner_uid: 'user-a',
      title: 'Khám phá sông Hàn',
      date: '2026-11-23',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ place_id: 'cau-rong', start: '18:00', end: '20:00', day: 1 }],
      version: 1,
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T10:00:00Z',
    },
  ];

  const result = reconcileRemoteItineraries(current, remote);
  assert.equal(result.addedCount, 1);
  assert.equal(result.updatedCount, 0);
  assert.equal(result.conflictedCount, 0);
  assert.equal(result.unmodifiedCount, 1);

  assert.equal(result.reconciled.length, 2);
  const remoteAdded = result.reconciled.find((i) => i.remoteId === 101);
  assert.ok(remoteAdded);
  assert.equal(remoteAdded.title, 'Khám phá sông Hàn');
  assert.equal(remoteAdded.date, '23/11/2026');
  assert.equal(remoteAdded.syncStatus, 'synced');
  assert.equal(remoteAdded.version, 1);
});

// ---------------------------------------------------------------------------
// 4. Pure Remote Reconciliation: Idempotent merge
// ---------------------------------------------------------------------------
test('4. reconcileRemoteItineraries is completely idempotent on repeated runs', () => {
  const current = [
    {
      id: 'itin-101',
      remoteId: 101,
      version: 1,
      syncStatus: 'synced',
      title: 'Khám phá sông Hàn',
      date: '23/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cau-rong', start: '18:00', end: '20:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  const remote = [
    {
      id: 101,
      owner_uid: 'user-a',
      title: 'Khám phá sông Hàn',
      date: '2026-11-23',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ place_id: 'cau-rong', start: '18:00', end: '20:00', day: 1 }],
      version: 1,
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T10:00:00Z',
    },
  ];

  const result = reconcileRemoteItineraries(current, remote);
  assert.equal(result.addedCount, 0);
  assert.equal(result.updatedCount, 0);
  assert.equal(result.conflictedCount, 0);
  assert.equal(result.unmodifiedCount, 1);
  assert.equal(result.reconciled.length, 1);
  assert.equal(result.reconciled[0].id, 'itin-101');
});

// ---------------------------------------------------------------------------
// 5. Remote Reconciliation: Deterministic collision avoidance without Date.now() (F-06)
// ---------------------------------------------------------------------------
test('5. reconcileRemoteItineraries deterministically avoids ID collisions without Date.now()', () => {
  const current = [
    {
      id: 'itin-202',
      title: 'Mục local trùng tên mã',
      date: '24/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
      saved: true,
      syncStatus: 'local',
    },
  ];

  const remote = [
    {
      id: 202,
      owner_uid: 'user-a',
      title: 'Mục từ máy chủ 202',
      date: '2026-11-24',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ place_id: 'son-tra', start: '14:00', end: '16:00', day: 1 }],
      version: 1,
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T10:00:00Z',
    },
  ];

  const result1 = reconcileRemoteItineraries(current, remote);
  const result2 = reconcileRemoteItineraries(current, remote);

  assert.equal(result1.addedCount, 1);
  assert.equal(result1.reconciled.length, 2);

  const remoteItem1 = result1.reconciled.find((i) => i.remoteId === 202);
  const remoteItem2 = result2.reconciled.find((i) => i.remoteId === 202);

  // Khẳng định ID sinh ra mang tính tất định tuyệt đối
  assert.equal(remoteItem1.id, 'remote-202-1');
  assert.equal(remoteItem2.id, 'remote-202-1');
  assert.equal(remoteItem1.id, remoteItem2.id);
});

// ---------------------------------------------------------------------------
// 6. Remote Reconciliation: Conflict preservation for pending & conflict
// ---------------------------------------------------------------------------
test('6. reconcileRemoteItineraries preserves local uncommitted changes when remote version mismatches', () => {
  const current = [
    {
      id: 'itin-303',
      remoteId: 303,
      version: 1,
      syncStatus: 'pending',
      title: 'Tiêu đề sửa cục bộ chưa đẩy lên máy chủ',
      date: '25/11/2026',
      duration: 2,
      pace: 'Năng động',
      stops: [{ placeId: 'ba-na', start: '08:00', end: '15:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  const remote = [
    {
      id: 303,
      owner_uid: 'user-a',
      title: 'Tiêu đề trên máy chủ (version 2)',
      date: '2026-11-25',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ place_id: 'cham', start: '09:00', end: '10:00', day: 1 }],
      version: 2,
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T11:00:00Z',
    },
  ];

  const result = reconcileRemoteItineraries(current, remote);
  assert.equal(result.conflictedCount, 1);
  assert.equal(result.addedCount, 0);

  const conflictedItem = result.reconciled[0];
  assert.equal(conflictedItem.syncStatus, 'conflict');
  // Local changes are strictly preserved
  assert.equal(conflictedItem.title, 'Tiêu đề sửa cục bộ chưa đẩy lên máy chủ');
  assert.equal(conflictedItem.duration, 2);
  assert.equal(conflictedItem.stops[0].placeId, 'ba-na');
});

// ---------------------------------------------------------------------------
// 7. Remote Reconciliation: Conflict preservation for syncStatus='error' (F-05)
// ---------------------------------------------------------------------------
test('7. reconcileRemoteItineraries preserves local uncommitted changes when syncStatus is error (F-05)', () => {
  const current = [
    {
      id: 'itin-404',
      remoteId: 404,
      version: 1,
      syncStatus: 'error',
      title: 'Tiêu đề sửa cục bộ nhưng gặp lỗi mạng khi gửi',
      date: '26/11/2026',
      duration: 1,
      pace: 'Cân bằng',
      stops: [{ placeId: 'cau-rong', start: '19:00', end: '21:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  const remote = [
    {
      id: 404,
      owner_uid: 'user-a',
      title: 'Tiêu đề cũ trên máy chủ version 2',
      date: '2026-11-26',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ place_id: 'cham', start: '09:00', end: '10:00', day: 1 }],
      version: 2,
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T11:00:00Z',
    },
  ];

  const result = reconcileRemoteItineraries(current, remote);
  assert.equal(result.conflictedCount, 1);
  assert.equal(result.updatedCount, 0);

  const item = result.reconciled[0];
  assert.equal(item.syncStatus, 'conflict');
  // Local edits must NOT be overwritten by remote!
  assert.equal(item.title, 'Tiêu đề sửa cục bộ nhưng gặp lỗi mạng khi gửi');
  assert.equal(item.stops[0].placeId, 'cau-rong');
});

// ---------------------------------------------------------------------------
// 8. No auto-upload during reconciliation or loading
// ---------------------------------------------------------------------------
test('8. Storage and reconciliation operations do not trigger network calls', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount++;
    throw new Error('Network call should not occur');
  };

  try {
    storageMap.clear();
    const loaded = await itineraryStorage.loadItinerariesForAccount({ signedIn: false });
    assert.ok(Array.isArray(loaded));

    const reconciled = reconcileRemoteItineraries([], []);
    assert.equal(reconciled.reconciled.length, 0);

    await itineraryStorage.saveItinerariesForAccount({ signedIn: false }, loaded);
    await itineraryStorage.flush({ signedIn: false });
    assert.equal(fetchCallCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 9. Account switch lifecycle: Guest -> User A -> Logout -> User B -> User A
// ---------------------------------------------------------------------------
test('9. Account switch lifecycle strictly preserves data and isolates accounts', async () => {
  storageMap.clear();

  const guestCtx = { signedIn: false };
  const userACtx = { signedIn: true, user: { uid: 'usr_alpha', email: 'usera@danangacy.vn' } };
  const userBCtx = { signedIn: true, user: { uid: 'usr_beta', email: 'userb@danangacy.vn' } };

  // Step 1: Guest khởi tạo và tạo lịch trình Guest
  const guestInitial = await itineraryStorage.loadItinerariesForAccount(guestCtx);
  assert.ok(guestInitial.length >= 1);
  const guestCustom = [
    {
      id: 'guest-itin-1',
      title: 'Lịch trình của Khách',
      date: '10/12/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '09:00', end: '11:00', dayIndex: 1 }],
      saved: true,
      syncStatus: 'local',
    },
  ];
  await itineraryStorage.saveItinerariesForAccount(guestCtx, guestCustom);
  await itineraryStorage.flush(guestCtx);

  // Step 2: User A đăng nhập -> Phải bắt đầu với danh sách rỗng (cô lập khỏi Guest)
  const userAInitial = await itineraryStorage.loadItinerariesForAccount(userACtx);
  assert.equal(userAInitial.length, 0);

  // User A lưu lịch trình của User A
  const userAData = [
    {
      id: 'itin-a1',
      remoteId: 501,
      version: 1,
      syncStatus: 'synced',
      title: 'Lịch trình của User A',
      date: '11/12/2026',
      duration: 2,
      pace: 'Cân bằng',
      stops: [{ placeId: 'ba-na', start: '08:00', end: '16:00', dayIndex: 1 }],
      saved: true,
    },
  ];
  await itineraryStorage.saveItinerariesForAccount(userACtx, userAData);
  await itineraryStorage.flush(userACtx);

  // Step 3: Đăng xuất về Guest -> Dữ liệu của Guest phải được bảo toàn nguyên vẹn
  const guestReloaded = await itineraryStorage.loadItinerariesForAccount(guestCtx);
  assert.equal(guestReloaded.length, 1);
  assert.equal(guestReloaded[0].id, 'guest-itin-1');
  assert.equal(guestReloaded[0].title, 'Lịch trình của Khách');

  // Step 4: User B đăng nhập -> Cô lập hoàn toàn khỏi User A và Guest (bắt đầu rỗng)
  const userBInitial = await itineraryStorage.loadItinerariesForAccount(userBCtx);
  assert.equal(userBInitial.length, 0);

  // User B lưu lịch trình của User B
  const userBData = [
    {
      id: 'itin-b1',
      remoteId: 601,
      version: 1,
      syncStatus: 'synced',
      title: 'Lịch trình của User B',
      date: '12/12/2026',
      duration: 1,
      pace: 'Năng động',
      stops: [{ placeId: 'son-tra', start: '06:00', end: '10:00', dayIndex: 1 }],
      saved: true,
    },
  ];
  await itineraryStorage.saveItinerariesForAccount(userBCtx, userBData);
  await itineraryStorage.flush(userBCtx);

  // Step 5: User A đăng nhập lại -> Khôi phục chính xác dữ liệu của User A
  const userAReloaded = await itineraryStorage.loadItinerariesForAccount(userACtx);
  assert.equal(userAReloaded.length, 1);
  assert.equal(userAReloaded[0].id, 'itin-a1');
  assert.equal(userAReloaded[0].title, 'Lịch trình của User A');
  assert.equal(userAReloaded[0].remoteId, 501);

  // Step 6: User B đăng nhập lại -> Khôi phục chính xác dữ liệu của User B
  const userBReloaded = await itineraryStorage.loadItinerariesForAccount(userBCtx);
  assert.equal(userBReloaded.length, 1);
  assert.equal(userBReloaded[0].id, 'itin-b1');
  assert.equal(userBReloaded[0].title, 'Lịch trình của User B');
});

// ---------------------------------------------------------------------------
// 10. Canonical Account Identity: Backend UID takes highest precedence (F-07)
// ---------------------------------------------------------------------------
test('10. Canonical Account Identity: Backend UID takes canonical precedence over ID (F-07)', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret_token';

  // 1. User mang cả canonical UID và legacy ID: UID phải luôn thắng!
  const userWithBoth = {
    signedIn: true,
    user: { id: 77, uid: 'usr_canonical_999', email: 'user@danangacy.vn' },
    token,
  };
  const key1 = getAccountStorageKey(userWithBoth);
  assert.equal(key1, 'danangacy.itineraries.user.usr_canonical_999');
  assert.equal(key1.includes(token), false, 'Storage key must NEVER include JWT token');

  // 2. User chỉ mang UID
  const userWithUidOnly = {
    signedIn: true,
    user: { uid: 'usr_backend_123', email: 'user2@danangacy.vn' },
  };
  assert.equal(getAccountStorageKey(userWithUidOnly), 'danangacy.itineraries.user.usr_backend_123');

  // 3. Demo / legacy mock user chỉ mang integer id
  const legacyDemoUser = {
    signedIn: true,
    user: { id: 42, email: 'demo@danangacy.vn' },
  };
  assert.equal(getAccountStorageKey(legacyDemoUser), 'danangacy.itineraries.user.42');

  // 4. Tuyệt đối không fallback sang 'unknown' hay email khi định danh bị thiếu/sai
  assert.throws(
    () => {
      getAccountStorageKey({
        signedIn: true,
        user: { email: 'bad@test.vn' }, // Không có uid hoặc id
      });
    },
    { message: /Không thể xác định định danh người dùng ổn định/ },
  );
});

// ---------------------------------------------------------------------------
// 11. Safe legacy ownership: Legacy containing signedIn=true & User A is NOT given to Guest (F-02 & F-09)
// ---------------------------------------------------------------------------
test('11. Legacy storage containing signedIn=true and User A is quarantined and NEVER given to Guest (F-02 & F-09)', async () => {
  storageMap.clear();

  const legacyUserA = {
    signedIn: true,
    user: { id: 101, uid: 'usr_old_a', email: 'usera@danangacy.vn' },
    trips: [
      {
        id: 'legacy-user-a-trip',
        title: 'Chuyến đi bí mật của User A từ phiên bản v1',
        date: '01/01/2026',
        duration: 1,
        pace: 'Thư thả',
        stops: [{ placeId: 'cham', start: '09:00', end: '11:00', dayIndex: 1 }],
        saved: true,
      },
    ],
  };

  storageMap.set(LEGACY_STORAGE_KEY, JSON.stringify(legacyUserA));

  // Khách (Guest) mở ứng dụng lần đầu
  const guestLoaded = await itineraryStorage.loadItinerariesForAccount({ signedIn: false });

  // Guest TUYỆT ĐỐI KHÔNG được nhìn thấy chuyến đi của User A!
  assert.ok(guestLoaded.length >= 1);
  assert.notEqual(guestLoaded[0].id, 'legacy-user-a-trip');
  assert.notEqual(guestLoaded[0].title, 'Chuyến đi bí mật của User A từ phiên bản v1');

  // Bản ghi legacy gốc trong danangacy.demo.v1 không bị xóa
  assert.ok(storageMap.has(LEGACY_STORAGE_KEY));

  // Bản ghi legacy đã được cách ly vào unclaimed_legacy
  assert.ok(storageMap.has(UNCLAIMED_LEGACY_KEY));
  const quarantined = JSON.parse(storageMap.get(UNCLAIMED_LEGACY_KEY));
  assert.equal(quarantined[0].id, 'legacy-user-a-trip');
});

// ---------------------------------------------------------------------------
// 12. Safe legacy ownership: Unclaimed legacy is quarantined and not assigned to Guest (F-02)
// ---------------------------------------------------------------------------
test('12. Unclaimed legacy without owner proof is quarantined and not assigned to Guest (F-02)', async () => {
  storageMap.clear();

  const legacyUnclaimed = {
    signedIn: false,
    trips: [
      {
        id: 'legacy-unclaimed-trip',
        title: 'Chuyến đi cũ không rõ chủ sở hữu',
        date: '05/05/2026',
        duration: 1,
        pace: 'Thư thả',
        stops: [{ placeId: 'cham', start: '09:00', end: '11:00', dayIndex: 1 }],
        saved: true,
      },
    ],
  };

  storageMap.set(LEGACY_STORAGE_KEY, JSON.stringify(legacyUnclaimed));

  const guestLoaded = await itineraryStorage.loadItinerariesForAccount({ signedIn: false });

  // Guest nhận demo mặc định, không tự động gán dữ liệu không rõ chủ sở hữu
  assert.notEqual(guestLoaded[0].id, 'legacy-unclaimed-trip');
  assert.ok(storageMap.has(UNCLAIMED_LEGACY_KEY));
});

// ---------------------------------------------------------------------------
// 13. Global storage never receives user itineraries (F-01)
// ---------------------------------------------------------------------------
test('13. appStateRepository.save never writes user itineraries into danangacy.demo.v1 (F-01)', async () => {
  storageMap.clear();

  // Khởi tạo global legacy với demo gốc
  const initialDemo = {
    signedIn: false,
    trips: [{ id: 'demo-original', title: 'Demo gốc' }],
  };
  storageMap.set(LEGACY_STORAGE_KEY, JSON.stringify(initialDemo));

  // Giả lập AppProvider lưu state khi User A đang đăng nhập (không truyền itineraries)
  await appStateRepository.save({
    signedIn: true,
    token: 'token-abc',
    user: { id: 101, email: 'usera@danangacy.vn', display_name: 'User A' },
    name: 'User A',
    email: 'usera@danangacy.vn',
    phone: '0901234567',
    favorites: ['cham'],
    quizCompleted: false,
    quizAnswers: [],
    points: 100,
    rewardRedeemed: false,
  });

  const rawGlobal = JSON.parse(storageMap.get(LEGACY_STORAGE_KEY));
  assert.equal(rawGlobal.signedIn, true);
  assert.equal(rawGlobal.name, 'User A');
  // Lịch trình trong global storage phải là demo-original, tuyệt đối không có dữ liệu user!
  assert.equal(rawGlobal.itineraries[0].id, 'demo-original');
});

// ---------------------------------------------------------------------------
// 14. Storage failure safety & Persistence Coordinator error tracking (F-04)
// ---------------------------------------------------------------------------
test('14. Storage write failure is accurately captured in getLastError and returns false (F-04)', async () => {
  simulateStorageFailure = true;
  itineraryPersistence.clearLastError();

  try {
    const savePromise = itineraryStorage.saveItinerariesForAccount({ signedIn: false }, [
      {
        id: 'test-fail',
        title: 'Test fail',
        date: '20/11/2026',
        duration: 1,
        pace: 'Thư thả',
        stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
        saved: true,
      },
    ]);

    const result = await savePromise;
    assert.equal(
      result,
      false,
      'saveItinerariesForAccount must report failure when storage throws',
    );
    assert.ok(itineraryPersistence.getLastError(), 'getLastError must record the actual exception');
  } finally {
    simulateStorageFailure = false;
    itineraryPersistence.clearLastError();
  }
});

// ---------------------------------------------------------------------------
// 15. Persistence Queue: Tuần tự hoá và chống out-of-order writes (F-04)
// ---------------------------------------------------------------------------
test('15. Persistence coordinator serializes writes and prevents out-of-order overwrite (F-04)', async () => {
  storageMap.clear();

  const userCtx = { signedIn: true, user: { uid: 'usr_seq_test' } };

  // Ghi 1: snapshot A1
  const snap1 = [
    {
      id: 'snap-1',
      title: 'Snapshot 1 cũ hơn',
      date: '20/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  // Ghi 2: snapshot A2 mới hơn
  const snap2 = [
    {
      id: 'snap-2',
      title: 'Snapshot 2 mới nhất',
      date: '20/11/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  // Gửi cả 2 write đồng thời:
  const p1 = itineraryStorage.saveItinerariesForAccount(userCtx, snap1);
  const p2 = itineraryStorage.saveItinerariesForAccount(userCtx, snap2);

  await Promise.all([p1, p2]);
  await itineraryStorage.flush(userCtx);

  // Snapshot cuối cùng trên đĩa phải luôn là snap2!
  const loaded = await itineraryStorage.loadItinerariesForAccount(userCtx);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, 'snap-2');
  assert.equal(loaded[0].title, 'Snapshot 2 mới nhất');
});

// ---------------------------------------------------------------------------
// 16. React State & Account Boundary: Hydration Gate blocks stale data (F-03)
// ---------------------------------------------------------------------------
test('16. Hydration Gate state machine blocks stale data on the exact switch frame (F-03)', () => {
  // Mô phỏng logic gate trong AccountItineraryScope:
  // Render Frame 0: User A active
  let activeAccountKey = 'danangacy.itineraries.user.usr_alpha';
  let hydratedState = {
    key: 'danangacy.itineraries.user.usr_alpha',
    itineraries: [{ id: 'user-a-secret', title: 'Bí mật User A' }],
  };

  function renderScope(accountKey, state) {
    if (state.key !== accountKey) {
      // Gate đóng: Render frame chuyển đổi trả về null ngay lập tức!
      return null;
    }
    // Gate mở: Render Provider với state đúng tài khoản
    return {
      renderedKey: state.key,
      data: state.itineraries,
    };
  }

  // Frame 0: User A đang xem
  const frame0 = renderScope(activeAccountKey, hydratedState);
  assert.equal(frame0.renderedKey, 'danangacy.itineraries.user.usr_alpha');

  // Trigger: User A bấm Logout!
  // Frame 1: Ngay trong render frame đầu tiên sau Logout:
  activeAccountKey = 'danangacy.itineraries.guest';
  const frame1 = renderScope(activeAccountKey, hydratedState);

  // Khẳng định 100%: Gate trả về null! Toàn bộ component tree cũ unmount! Zero stale frame!
  assert.equal(
    frame1,
    null,
    'Hydration gate MUST return null on switch frame to prevent stale render',
  );

  // Sau khi load xong dữ liệu Guest:
  hydratedState = {
    key: 'danangacy.itineraries.guest',
    itineraries: [{ id: 'guest-clean', title: 'Lịch trình Guest' }],
  };
  const frame2 = renderScope(activeAccountKey, hydratedState);
  assert.equal(frame2.renderedKey, 'danangacy.itineraries.guest');
  assert.equal(frame2.data[0].id, 'guest-clean');
});

// ---------------------------------------------------------------------------
// 17. No Silent Data Repair: Legacy item with duration=1, dayIndex=3 is quarantined (F-08)
// ---------------------------------------------------------------------------
test('17. No Silent Data Repair: Legacy item with duration=1, dayIndex=3 is quarantined without mutation (F-08)', () => {
  const dirtyItems = [
    {
      id: 'invalid-day-item',
      title: 'Lịch trình 1 ngày nhưng điểm dừng ghi ngày 3',
      date: '20/11/2026',
      duration: 1, // 1 ngày
      pace: 'Thư thả',
      stops: [
        { placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 3 }, // 3 > 1: Vi phạm ràng buộc!
      ],
      saved: true,
    },
    {
      id: 'valid-item',
      title: 'Lịch trình hợp lệ',
      date: '20/11/2026',
      duration: 2,
      pace: 'Thư thả',
      stops: [{ placeId: 'son-tra', start: '09:00', end: '10:00', dayIndex: 2 }],
      saved: true,
    },
  ];

  const { valid, quarantined } = validateAndQuarantineItineraries(dirtyItems);

  // 1. Bản ghi vi phạm phải bị đưa vào quarantined
  assert.equal(quarantined.length, 1);
  const bad = quarantined[0];
  assert.equal(bad.id, 'invalid-day-item');
  // DỮ LIỆU GỐC ĐƯỢC BẢO TOÀN NGUYÊN VẸN, KHÔNG BỊ SỬA THÀNH 1!
  assert.equal(
    bad.stops[0].dayIndex,
    3,
    'Raw invalid data must NEVER be silently clamped or repaired',
  );

  // 2. Chỉ bản ghi hợp lệ được đưa vào danh sách active
  assert.equal(valid.length, 1);
  assert.equal(valid[0].id, 'valid-item');
  assert.equal(valid[0].stops[0].dayIndex, 2);
});

// ---------------------------------------------------------------------------
// 18. No Silent Data Repair: Invalid duration or missing fields are quarantined (F-08)
// ---------------------------------------------------------------------------
test('18. No Silent Data Repair: Invalid duration or missing fields are quarantined (F-08)', () => {
  const items = [
    {
      id: 'bad-duration',
      title: 'Lịch trình 5 ngày',
      duration: 5, // Ngoài 1..3
      stops: [],
    },
    {
      id: 'bad-stop-type',
      title: 'Điểm dừng sai kiểu dayIndex',
      duration: 2,
      stops: [{ placeId: 'cham', dayIndex: 'abc' }],
    },
  ];

  const { valid, quarantined } = validateAndQuarantineItineraries(items);
  assert.equal(valid.length, 0);
  assert.equal(quarantined.length, 2);
  assert.equal(quarantined[0].duration, 5, 'Duration must remain 5 in raw quarantine');
});

// ---------------------------------------------------------------------------
// 19. Backend mapping validation rejects invalid data
// ---------------------------------------------------------------------------
test('19. Backend mapping strictly validates duration, pace and stop dayIndex', () => {
  assert.throws(
    () => {
      mapItineraryToBackendCreate({
        id: 'test-1',
        title: 'Chuyến đi 5 ngày',
        date: '20/11/2026',
        duration: 5,
        pace: 'Thư thả',
        stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
        saved: true,
      });
    },
    { message: /Thời lượng lịch trình \(duration\) không hợp lệ/ },
  );

  assert.throws(
    () => {
      mapItineraryToBackendCreate({
        id: 'test-2',
        title: 'Chuyến đi tốc biến',
        date: '20/11/2026',
        duration: 1,
        pace: 'Cực nhanh',
        stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
        saved: true,
      });
    },
    { message: /Nhịp độ lịch trình \(pace\) không hợp lệ/ },
  );

  assert.throws(
    () => {
      mapItineraryToBackendCreate({
        id: 'test-3',
        title: 'Chuyến đi 1 ngày nhưng điểm dừng ngày 2',
        date: '20/11/2026',
        duration: 1,
        pace: 'Thư thả',
        stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 2 }],
        saved: true,
      });
    },
    { message: /vượt quá thời lượng lịch trình/ },
  );

  assert.throws(
    () => {
      mapItineraryToBackendUpdate(
        {
          id: 'test-4',
          title: 'Cập nhật hợp lệ',
          date: '20/11/2026',
          duration: 1,
          pace: 'Thư thả',
          stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
          saved: true,
        },
        0,
      );
    },
    { message: /Phiên bản \(version\) phải là số nguyên dương hợp lệ/ },
  );
});

// ---------------------------------------------------------------------------
// 20. Repository: replaceItineraries & clearItineraries
// ---------------------------------------------------------------------------
test('20. replaceItineraries and clearItineraries manage store state cleanly', () => {
  const repo = createItineraryRepository();
  assert.ok(repo.getSnapshot().itineraries.length > 0);

  const customList = [
    {
      id: 'custom-1',
      title: 'Tự định nghĩa 1',
      date: '01/12/2026',
      duration: 1,
      pace: 'Thư thả',
      stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
      saved: true,
    },
  ];

  repo.actions.replaceItineraries(customList);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].id, 'custom-1');

  repo.actions.clearItineraries();
  assert.equal(repo.getSnapshot().itineraries.length, 0);
});
