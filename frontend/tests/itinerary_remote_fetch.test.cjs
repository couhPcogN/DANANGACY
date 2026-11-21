const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// In-memory AsyncStorage mock
const storageMap = new Map();

const asyncStorageMock = {
  async getItem(key) {
    return storageMap.has(key) ? storageMap.get(key) : null;
  },
  async setItem(key, value) {
    storageMap.set(key, value);
  },
  async removeItem(key) {
    storageMap.delete(key);
  },
  async clear() {
    storageMap.clear();
  },
};

const reactNativeMock = {
  Platform: { OS: 'ios' },
  Alert: {
    alert: () => {},
  },
};

const moduleCache = new Map();

function loadTs(relativePath) {
  const file = path.resolve(root, relativePath);
  if (moduleCache.has(file)) {
    return moduleCache.get(file).exports;
  }
  const module = { exports: {} };
  moduleCache.set(file, module);

  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const localRequire = (id) => {
    if (id === '@react-native-async-storage/async-storage') {
      return asyncStorageMock;
    }
    if (id === 'react-native') {
      return reactNativeMock;
    }
    if (/\.(jpg|png)$/.test(id)) return path.basename(id);
    if (id.startsWith('.')) {
      const base = path.resolve(path.dirname(file), id);
      const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(
        fs.existsSync,
      );
      if (resolved) return loadTs(path.relative(root, resolved));
    }
    return require(id);
  };

  const fn = vm.runInThisContext('(function(require, module, exports) {' + code + '\n})', {
    filename: file,
  });
  fn(localRequire, module, module.exports);
  return module.exports;
}

// Nạp các modules
const { createItineraryRepository } = loadTs(
  'src/features/itinerary/repositories/itineraryRepository.ts',
);
const { orchestrateRemoteFetchItineraries, resetFetchTracker } = loadTs(
  'src/features/itinerary/viewmodels/itineraryFetchOrchestrator.ts',
);
const { orchestrateDeleteItinerary, orchestrateCreateItinerary, orchestrateUpdateItinerary } =
  loadTs('src/features/itinerary/viewmodels/itineraryCrudOrchestrator.ts');
const { invalidateAuthSession, getMutationSeq, getActiveMutationsCount, resetSyncCoordinator } =
  loadTs('src/features/itinerary/viewmodels/itinerarySyncCoordinator.ts');
const { reconcileRemoteItineraries } = loadTs(
  'src/features/itinerary/models/itineraryReconciliation.ts',
);
const { ItineraryApiError } = loadTs('src/services/api/itineraryService.ts');
const { itineraryStorage } = loadTs('src/services/storage/itineraryStorage.ts');

// Sample remote item generator
function createMockRemoteItem(id, version, title = 'Lịch trình máy chủ') {
  return {
    id,
    title,
    date: '2026-11-25',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
    version,
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// 1. Guest does not call GET Backend
// ---------------------------------------------------------------------------
test('1. Guest does not call GET Backend API and keeps Local-First', async () => {
  resetFetchTracker();
  let apiCalled = false;
  const mockApi = {
    fetchItineraries: async () => {
      apiCalled = true;
      throw new Error('Should not be called for Guest');
    },
  };

  const repo = createItineraryRepository([]);
  const guestAuth = { signedIn: false, token: null, user: null };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: guestAuth,
    apiService: mockApi,
  });

  assert.equal(apiCalled, false, 'API must not be invoked for Guest');
  assert.equal(result.skipped, true);
  assert.equal(result.success, false);
});

// ---------------------------------------------------------------------------
// 2. Signed-in with JWT calls GET exactly once
// ---------------------------------------------------------------------------
test('2. Signed-in user calls GET exactly once with Bearer token', async () => {
  resetFetchTracker();
  let apiCalls = 0;
  let receivedToken = null;
  const mockApi = {
    fetchItineraries: async (token) => {
      apiCalls++;
      receivedToken = token;
      return [createMockRemoteItem(101, 1, 'Lịch trình User A')];
    },
  };

  const repo = createItineraryRepository([]);
  const authUser = {
    signedIn: true,
    token: 'jwt-token-alpha',
    user: { uid: 'usr_alpha', email: 'a@test.vn', display_name: 'User Alpha' },
  };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(apiCalls, 1);
  assert.equal(receivedToken, 'jwt-token-alpha');
  assert.equal(result.success, true);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 101);
});

// ---------------------------------------------------------------------------
// 3. No token -> does not fetch
// ---------------------------------------------------------------------------
test('3. Signed-in state without token does not call API', async () => {
  resetFetchTracker();
  let apiCalled = false;
  const mockApi = {
    fetchItineraries: async () => {
      apiCalled = true;
      return [];
    },
  };

  const repo = createItineraryRepository([]);
  const noTokenAuth = {
    signedIn: true,
    token: null,
    user: { uid: 'usr_alpha' },
  };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: noTokenAuth,
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(result.skipped, true);
});

// ---------------------------------------------------------------------------
// 4. Missing canonical user identity -> does not fetch
// ---------------------------------------------------------------------------
test('4. Missing canonical user identity rejects fetch', async () => {
  resetFetchTracker();
  let apiCalled = false;
  const mockApi = {
    fetchItineraries: async () => {
      apiCalled = true;
      return [];
    },
  };

  const repo = createItineraryRepository([]);
  const invalidAuth = {
    signedIn: true,
    token: 'jwt-token-valid',
    user: {}, // No uid or id
  };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: invalidAuth,
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(result.skipped, true);
  assert.equal(result.error, 'Missing canonical user identity');
});

// ---------------------------------------------------------------------------
// 5. GET returns new remote record -> merged correctly
// ---------------------------------------------------------------------------
test('5. New remote records are mapped and appended into local store with synced status', async () => {
  resetFetchTracker();
  const repo = createItineraryRepository([]);
  const mockApi = {
    fetchItineraries: async () => [
      createMockRemoteItem(201, 1, 'Khám phá Bà Nà'),
      createMockRemoteItem(202, 1, 'Biển Mỹ Khê'),
    ],
  };

  const authUser = {
    signedIn: true,
    token: 'token-5',
    user: { uid: 'usr_5' },
  };

  const res = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(res.success, true);
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 2);
  assert.equal(items[0].remoteId, 201);
  assert.equal(items[0].syncStatus, 'synced');
  assert.equal(items[1].remoteId, 202);
  assert.equal(items[1].syncStatus, 'synced');
});

// ---------------------------------------------------------------------------
// 6. Existing remoteId is not duplicated
// ---------------------------------------------------------------------------
test('6. Existing remoteId is never duplicated on repeated or overlapping remote items', async () => {
  resetFetchTracker();
  const existingItem = {
    id: 'local-itin-existing',
    remoteId: 301,
    version: 1,
    syncStatus: 'synced',
    title: 'Đã có sẵn',
    date: '25/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);
  const mockApi = {
    fetchItineraries: async () => [
      createMockRemoteItem(301, 1, 'Đã có sẵn trên server'),
      createMockRemoteItem(301, 1, 'Bản ghi trùng lặp server nếu có'),
      createMockRemoteItem(302, 1, 'Mục mới'),
    ],
  };

  const authUser = { signedIn: true, token: 'token-6', user: { uid: 'usr_6' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 2, 'Must not duplicate remoteId 301');
  assert.equal(items.filter((i) => i.remoteId === 301).length, 1);
});

// ---------------------------------------------------------------------------
// 7. Repeated GET is idempotent
// ---------------------------------------------------------------------------
test('7. Repeated GET invocations are completely idempotent', async () => {
  resetFetchTracker();
  const repo = createItineraryRepository([]);
  const remoteList = [createMockRemoteItem(401, 1), createMockRemoteItem(402, 2)];
  const mockApi = { fetchItineraries: async () => remoteList };

  const authUser = { signedIn: true, token: 'token-7', user: { uid: 'usr_7' } };

  // First fetch
  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const firstSnapshot = repo.getSnapshot().itineraries;

  // Second fetch with exact same data
  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const secondSnapshot = repo.getSnapshot().itineraries;
  assert.equal(firstSnapshot.length, secondSnapshot.length);
  assert.deepEqual(
    firstSnapshot.map((i) => i.id),
    secondSnapshot.map((i) => i.id),
  );
  assert.deepEqual(
    firstSnapshot.map((i) => i.version),
    secondSnapshot.map((i) => i.version),
  );
});

// ---------------------------------------------------------------------------
// 8. Synced item receives newer version
// ---------------------------------------------------------------------------
test('8. Synced item updates in-place when remote version is newer', async () => {
  resetFetchTracker();
  const localItem = {
    id: 'itin-synced-update',
    remoteId: 501,
    version: 1,
    syncStatus: 'synced',
    title: 'Tiêu đề cũ V1',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([localItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(501, 2, 'Tiêu đề mới V2 từ máy chủ')],
  };

  const authUser = { signedIn: true, token: 'token-8', user: { uid: 'usr_8' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const updated = repo.getSnapshot().itineraries[0];
  assert.equal(updated.id, 'itin-synced-update', 'Local ID must be preserved');
  assert.equal(updated.version, 2, 'Version must be incremented to 2');
  assert.equal(updated.title, 'Tiêu đề mới V2 từ máy chủ');
  assert.equal(updated.syncStatus, 'synced');
});

// ---------------------------------------------------------------------------
// 9. No downgrade when remote version is older
// ---------------------------------------------------------------------------
test('9. No downgrade when remote version is older than local version', async () => {
  resetFetchTracker();
  const localItem = {
    id: 'itin-no-downgrade',
    remoteId: 601,
    version: 3,
    syncStatus: 'synced',
    title: 'Bản mới nhất V3 trên thiết bị',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([localItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(601, 2, 'Bản cũ V2 từ server lag')],
  };

  const authUser = { signedIn: true, token: 'token-9', user: { uid: 'usr_9' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries[0];
  assert.equal(item.version, 3, 'Version must NOT be downgraded to 2');
  assert.equal(item.title, 'Bản mới nhất V3 trên thiết bị', 'Content must NOT be overwritten');
});

// ---------------------------------------------------------------------------
// 10. Pending record not overwritten
// ---------------------------------------------------------------------------
test('10. Pending record is protected from overwrite and marked conflict on version mismatch', async () => {
  resetFetchTracker();
  const localItem = {
    id: 'itin-pending-prot',
    remoteId: 701,
    version: 1,
    syncStatus: 'pending',
    title: 'Đang lưu in-flight trên local',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([localItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(701, 2, 'Nội dung máy chủ V2')],
  };

  const authUser = { signedIn: true, token: 'token-10', user: { uid: 'usr_10' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries[0];
  assert.equal(item.title, 'Đang lưu in-flight trên local', 'Local content must be protected');
  assert.equal(item.syncStatus, 'conflict', 'Must transition to conflict due to version mismatch');
});

// ---------------------------------------------------------------------------
// 11. Conflict record not overwritten
// ---------------------------------------------------------------------------
test('11. Conflict record is protected and retains conflict status', async () => {
  resetFetchTracker();
  const localItem = {
    id: 'itin-conflict-prot',
    remoteId: 801,
    version: 1,
    syncStatus: 'conflict',
    title: 'Bản sửa có xung đột',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([localItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(801, 2, 'Server V2')],
  };

  const authUser = { signedIn: true, token: 'token-11', user: { uid: 'usr_11' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries[0];
  assert.equal(item.title, 'Bản sửa có xung đột');
  assert.equal(item.syncStatus, 'conflict');
});

// ---------------------------------------------------------------------------
// 12. Error record not overwritten
// ---------------------------------------------------------------------------
test('12. Error record is protected from overwrite and retains local edits', async () => {
  resetFetchTracker();
  const localItem = {
    id: 'itin-err-prot',
    remoteId: 901,
    version: 1,
    syncStatus: 'error',
    title: 'Bản sửa bị lỗi mạng khi cập nhật',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([localItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(901, 1, 'Server V1')],
  };

  const authUser = { signedIn: true, token: 'token-12', user: { uid: 'usr_12' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries[0];
  assert.equal(item.title, 'Bản sửa bị lỗi mạng khi cập nhật');
  assert.equal(item.syncStatus, 'error');
});

// ---------------------------------------------------------------------------
// 13. Remote Dirty record not overwritten (F-10 Invariant)
// ---------------------------------------------------------------------------
test('13. Remote Dirty record (remoteId + syncStatus="local") is protected from overwrite', async () => {
  resetFetchTracker();
  const dirtyLocalItem = {
    id: 'itin-remote-dirty',
    remoteId: 1001,
    version: 1,
    syncStatus: 'local',
    title: 'Bản đã sửa V2 cục bộ sau khi V1 PATCH trả về',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([dirtyLocalItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(1001, 1, 'Bản V1 cũ trên máy chủ')],
  };

  const authUser = { signedIn: true, token: 'token-13', user: { uid: 'usr_13' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries[0];
  assert.equal(
    item.title,
    'Bản đã sửa V2 cục bộ sau khi V1 PATCH trả về',
    'Local edits must NOT be overwritten',
  );
  assert.equal(item.syncStatus, 'local', 'Must remain syncStatus="local"');
});

// ---------------------------------------------------------------------------
// 14. Local-only record not auto-uploaded
// ---------------------------------------------------------------------------
test('14. Local-only record is retained without triggering any mutating API call', async () => {
  resetFetchTracker();
  let mutatingApiCalled = false;
  const localOnlyItem = {
    id: 'itin-local-only-offline',
    title: 'Chỉ tạo cục bộ trên máy',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };

  const repo = createItineraryRepository([localOnlyItem]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(1101, 1, 'Lịch trình khác trên máy chủ')],
    createItinerary: async () => {
      mutatingApiCalled = true;
    },
    updateItinerary: async () => {
      mutatingApiCalled = true;
    },
  };

  const authUser = { signedIn: true, token: 'token-14', user: { uid: 'usr_14' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(mutatingApiCalled, false, 'Fetch must never trigger mutating API calls');
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 2);
  assert.ok(items.some((i) => i.id === 'itin-local-only-offline'));
  assert.ok(items.some((i) => i.remoteId === 1101));
});

// ---------------------------------------------------------------------------
// 15. GET timeout retains all local data
// ---------------------------------------------------------------------------
test('15. GET timeout retains all local data and sets remoteRefreshError', async () => {
  resetFetchTracker();
  const initialItem = {
    id: 'itin-local-timeout-test',
    remoteId: 1201,
    version: 1,
    syncStatus: 'synced',
    title: 'Dữ liệu trước timeout',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([initialItem]);
  const mockApi = {
    fetchItineraries: async () => {
      throw new ItineraryApiError('Lỗi kết nối mạng khi tải danh sách lịch trình.', 0);
    },
  };

  const authUser = { signedIn: true, token: 'token-15', user: { uid: 'usr_15' } };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 0);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Dữ liệu trước timeout');
  assert.ok(repo.getSnapshot().remoteRefreshError.includes('kết nối mạng'));
});

// ---------------------------------------------------------------------------
// 16. HTTP 401 does not lose data
// ---------------------------------------------------------------------------
test('16. HTTP 401 reports auth error and does not wipe local store', async () => {
  resetFetchTracker();
  const initialItem = {
    id: 'itin-local-401-test',
    title: 'Dữ liệu an toàn trước 401',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };

  const repo = createItineraryRepository([initialItem]);
  const mockApi = {
    fetchItineraries: async () => {
      throw new ItineraryApiError('Phiên đăng nhập đã hết hạn.', 401);
    },
  };

  const authUser = { signedIn: true, token: 'expired-token', user: { uid: 'usr_16' } };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.ok(repo.getSnapshot().remoteRefreshError.includes('hết hạn'));
});

// ---------------------------------------------------------------------------
// 17. Response malformed does not clear store
// ---------------------------------------------------------------------------
test('17. Malformed server response throws 502 and does not clear local itineraries', async () => {
  resetFetchTracker();
  const initialItem = {
    id: 'itin-malformed-test',
    title: 'Dữ liệu an toàn khi server lỗi schema',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };

  const repo = createItineraryRepository([initialItem]);
  const mockApi = {
    fetchItineraries: async () => {
      throw new ItineraryApiError('Bản ghi lịch trình từ máy chủ không đúng cấu trúc.', 502);
    },
  };

  const authUser = { signedIn: true, token: 'token-17', user: { uid: 'usr_17' } };

  const result = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: authUser,
    apiService: mockApi,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 502);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Dữ liệu an toàn khi server lỗi schema');
});

// ---------------------------------------------------------------------------
// 18. User A GET -> User B login -> response A arrives late
// ---------------------------------------------------------------------------
test('18. User A GET response arriving after User B login applies to User A storage only', async () => {
  resetFetchTracker();
  storageMap.clear();

  let resolveGet;
  const mockApi = {
    fetchItineraries: async () =>
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
  };

  const repoUserA = createItineraryRepository([]);
  const userAAuth = {
    signedIn: true,
    token: 'token-usr-a',
    user: { uid: 'usr_cross_a', email: 'a@test.vn' },
  };

  let currentAuth = userAAuth;

  const fetchPromise = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repoUserA.getSnapshot().itineraries,
      reconcileRemote: repoUserA.actions.reconcileRemote,
      setRemoteRefreshing: repoUserA.actions.setRemoteRefreshing,
      setRemoteRefreshError: repoUserA.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    getCurrentAuth: () => currentAuth,
    apiService: mockApi,
  });

  // Switch to User B
  const userBAuth = {
    signedIn: true,
    token: 'token-usr-b',
    user: { uid: 'usr_cross_b', email: 'b@test.vn' },
  };
  currentAuth = userBAuth;

  const repoUserB = createItineraryRepository([]);
  assert.equal(repoUserB.getSnapshot().itineraries.length, 0);

  // Response for User A arrives
  resolveGet([createMockRemoteItem(1801, 1, 'Lịch trình riêng của User A')]);
  const res = await fetchPromise;

  assert.equal(res.success, true);
  assert.equal(res.skipped, true, 'Must skip updating in-memory model of User B');

  // Verify User B model has 0 items
  assert.equal(repoUserB.getSnapshot().itineraries.length, 0, 'User B model must remain empty');

  // Verify User A partition received the record
  const storedUserA = await itineraryStorage.loadItinerariesForAccount(userAAuth);
  assert.equal(storedUserA.length, 1);
  assert.equal(storedUserA[0].remoteId, 1801);
});

// ---------------------------------------------------------------------------
// 19. Logout/re-login User A with stale response
// ---------------------------------------------------------------------------
test('19. Logout and re-login drops stale sequence response', async () => {
  resetFetchTracker();
  let resolveGet1;
  const mockApi = {
    fetchItineraries: async () =>
      new Promise((resolve) => {
        resolveGet1 = resolve;
      }),
  };

  const repo = createItineraryRepository([]);
  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_seq_a' } };

  // First fetch started
  const fetch1 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: mockApi,
  });

  // Second fetch triggered (advances sequence)
  const fetch2 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    force: true,
    apiService: {
      fetchItineraries: async () => [createMockRemoteItem(1902, 1, 'Lần tải thứ 2')],
    },
  });

  await fetch2;
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 1902);

  // Now resolve first fetch late
  resolveGet1([createMockRemoteItem(1901, 1, 'Lần tải thứ 1 bị trễ')]);
  const res1 = await fetch1;

  assert.equal(res1.skipped, true);
  assert.equal(res1.error, 'Stale sequence');
  // Store must still contain item 1902 from fetch 2
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 1902);
});

// ---------------------------------------------------------------------------
// 20. Two GETs for same account return out-of-order
// ---------------------------------------------------------------------------
test('20. Out-of-order GET responses are strictly protected by sequence tracking', async () => {
  resetFetchTracker();
  let resolveSlow;
  let resolveFast;

  const repo = createItineraryRepository([]);
  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_order_a' } };

  // Call 1: Slow
  const p1 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: {
      fetchItineraries: () =>
        new Promise((resolve) => {
          resolveSlow = resolve;
        }),
    },
  });

  // Call 2: Fast
  const p2 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    force: true,
    apiService: {
      fetchItineraries: () =>
        new Promise((resolve) => {
          resolveFast = resolve;
        }),
    },
  });

  // Fast resolves first
  resolveFast([createMockRemoteItem(2002, 2, 'Version 2 mới nhất')]);
  await p2;
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 2002);

  // Slow resolves later
  resolveSlow([createMockRemoteItem(2001, 1, 'Version 1 cũ hơn')]);
  const res1 = await p1;

  assert.equal(res1.skipped, true);
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 2002);
});

// ---------------------------------------------------------------------------
// 21. Local edit happens while GET is in flight
// ---------------------------------------------------------------------------
test('21. Local edit occurring while GET is in-flight is preserved through reconciliation', async () => {
  resetFetchTracker();
  let resolveGet;
  const initialSynced = {
    id: 'itin-edit-in-flight',
    remoteId: 2101,
    version: 1,
    syncStatus: 'synced',
    title: 'Tiêu đề V1 ban đầu',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([initialSynced]);
  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_edit_a' } };

  const fetchPromise = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: {
      fetchItineraries: () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    },
  });

  // While GET is awaiting, user modifies local item to V2
  repo.actions.startEdit('itin-edit-in-flight');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Tiêu đề V2 người dùng vừa sửa',
  });
  repo.actions.saveEdit();
  repo.actions.updateSyncStatus('itin-edit-in-flight', 'local');

  // Server returns V1 (same base version)
  resolveGet([createMockRemoteItem(2101, 1, 'Tiêu đề V1 ban đầu')]);
  await fetchPromise;

  const currentItem = repo.getSnapshot().itineraries.find((i) => i.id === 'itin-edit-in-flight');
  assert.equal(
    currentItem.title,
    'Tiêu đề V2 người dùng vừa sửa',
    'Local edit must NOT be overwritten',
  );
  assert.equal(currentItem.syncStatus, 'local', 'Must retain local syncStatus');
});

// ---------------------------------------------------------------------------
// 22. POST timeout then GET returns similar record: no auto-merging by title/date
// ---------------------------------------------------------------------------
test('22. Ambiguous Create: POST timeout local record coexists safely without auto-merge by title/date', async () => {
  resetFetchTracker();
  // Local record created after POST timeout: has title "Chuyến đi Hội An", remoteId undefined, syncStatus 'error'
  const timedOutLocalItem = {
    id: 'local-timed-out-post',
    remoteId: undefined,
    version: undefined,
    syncStatus: 'error',
    title: 'Chuyến đi Hội An',
    date: '25/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([timedOutLocalItem]);
  // Server returns record with identical title and date created by previous timeout
  const mockApi = {
    fetchItineraries: async () => [
      {
        id: 2201,
        title: 'Chuyến đi Hội An',
        date: '2026-11-25',
        duration: 1,
        pace: 'Thư thả',
        stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
        version: 1,
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-20T10:00:00Z',
      },
    ],
  };

  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_ambiguous' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: mockApi,
  });

  const items = repo.getSnapshot().itineraries;
  // BẮT BUỘC giữ cả 2 bản ghi riêng biệt:
  // 1. Bản ghi local-only có syncStatus="error" và remoteId=undefined
  // 2. Bản ghi máy chủ có remoteId=2201 và syncStatus="synced"
  assert.equal(items.length, 2, 'Must NOT auto-merge items by title/date');
  assert.ok(
    items.some(
      (i) =>
        i.id === 'local-timed-out-post' && i.remoteId === undefined && i.syncStatus === 'error',
    ),
  );
  assert.ok(items.some((i) => i.remoteId === 2201 && i.syncStatus === 'synced'));
});

// ---------------------------------------------------------------------------
// 23. Background fetch never calls POST/PATCH/DELETE
// ---------------------------------------------------------------------------
test('23. Fetch task is strictly read-only and never calls mutating endpoints', async () => {
  resetFetchTracker();
  let createCalled = false;
  let updateCalled = false;
  let deleteCalled = false;

  const repo = createItineraryRepository([]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(2301, 1)],
    createItinerary: async () => {
      createCalled = true;
    },
    updateItinerary: async () => {
      updateCalled = true;
    },
    deleteItinerary: async () => {
      deleteCalled = true;
    },
  };

  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_ro_check' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: mockApi,
  });

  assert.equal(createCalled, false);
  assert.equal(updateCalled, false);
  assert.equal(deleteCalled, false);
});

// ---------------------------------------------------------------------------
// 24. Persistence after merge does not lose newer data
// ---------------------------------------------------------------------------
test('24. Reconciled state is safely persisted to account storage partition', async () => {
  resetFetchTracker();
  storageMap.clear();

  const repo = createItineraryRepository([]);
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(2401, 1, 'Lưu bền vững')],
  };

  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_persist_24' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: mockApi,
  });

  const stored = await itineraryStorage.loadItinerariesForAccount(userAAuth);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].remoteId, 2401);
  assert.equal(stored[0].title, 'Lưu bền vững');
});

// ---------------------------------------------------------------------------
// 25. Missing remote items in GET list are NOT deleted from local store
// ---------------------------------------------------------------------------
test('25. Remote missing items are not deleted from local store', async () => {
  resetFetchTracker();
  const existingItem1 = {
    id: 'itin-exist-1',
    remoteId: 2501,
    version: 1,
    syncStatus: 'synced',
    title: 'Mục 1 vẫn còn trên server',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const existingItem2 = {
    id: 'itin-exist-2',
    remoteId: 2502,
    version: 1,
    syncStatus: 'synced',
    title: 'Mục 2 không có trong danh sách GET hiện tại',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem1, existingItem2]);
  // Server only returns item 2501 (e.g. pagination or filtered view)
  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(2501, 1, 'Mục 1')],
  };

  const userAAuth = { signedIn: true, token: 'token-a', user: { uid: 'usr_missing_25' } };

  await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAAuth,
    apiService: mockApi,
  });

  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 2, 'Item 2502 must NOT be deleted due to omission from GET response');
  assert.ok(items.some((i) => i.remoteId === 2501));
  assert.ok(items.some((i) => i.remoteId === 2502));
});

// ---------------------------------------------------------------------------
// 26. F-01 Case A: GET started before DELETE 204 does NOT resurrect deleted item
// ---------------------------------------------------------------------------
test('26. F-01 Case A: GET started before DELETE 204 does NOT resurrect deleted item', async () => {
  resetFetchTracker();
  const existingItem = {
    id: 'itin-del-26',
    remoteId: 2601,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình sắp bị xóa',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);
  let resolveGet;
  const mockApi = {
    fetchItineraries: async () =>
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    deleteItinerary: async () => true,
  };

  const userAuth = { signedIn: true, token: 'token-usr-26', user: { uid: 'usr_race_26' } };

  // 1. GET bắt đầu trước
  const fetchPromise = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAuth,
    getCurrentAuth: () => userAuth,
    apiService: mockApi,
  });

  // 2. DELETE chạy và thành công HTTP 204
  const delSuccess = await orchestrateDeleteItinerary({
    id: 'itin-del-26',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: null,
      saveDraft: repo.actions.saveDraft,
      saveEdit: repo.actions.saveEdit,
      deleteItinerary: repo.actions.deleteItinerary,
      restoreItinerary: repo.actions.restoreItinerary,
      replaceItineraries: repo.actions.replaceItineraries,
      attachRemoteMetadata: repo.actions.attachRemoteMetadata,
      updateSyncStatus: repo.actions.updateSyncStatus,
    },
    auth: userAuth,
    navigation: { navigate: () => {}, reset: () => {}, tab: () => {} },
    apiService: mockApi,
    confirm: (t, m, onConfirm) => onConfirm(),
  });
  assert.equal(delSuccess, true);
  assert.equal(repo.getSnapshot().itineraries.length, 0, 'Must be deleted locally');

  // 3. Phản hồi GET cũ (vẫn chứa item 2601) trả về
  resolveGet([createMockRemoteItem(2601, 1, 'Lịch trình vừa bị xóa')]);
  const res = await fetchPromise;

  assert.equal(res.skipped, true, 'Stale GET response must be skipped');
  assert.equal(
    repo.getSnapshot().itineraries.length,
    0,
    'Deleted item must NOT be resurrected by stale GET!',
  );
});

// ---------------------------------------------------------------------------
// 27. F-01 Case B: GET started during DELETE does NOT resurrect deleted item
// ---------------------------------------------------------------------------
test('27. F-01 Case B: GET started during DELETE does NOT resurrect deleted item', async () => {
  resetFetchTracker();
  const existingItem = {
    id: 'itin-del-27',
    remoteId: 2701,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình xóa B',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);
  let resolveDelete;
  let resolveGet;

  const mockApi = {
    fetchItineraries: async () =>
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    deleteItinerary: async () =>
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
  };

  const userAuth = { signedIn: true, token: 'token-usr-27', user: { uid: 'usr_race_27' } };

  // 1. DELETE bắt đầu chạy (đang pending trên mạng)
  const deletePromise = orchestrateDeleteItinerary({
    id: 'itin-del-27',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: null,
      saveDraft: repo.actions.saveDraft,
      saveEdit: repo.actions.saveEdit,
      deleteItinerary: repo.actions.deleteItinerary,
      restoreItinerary: repo.actions.restoreItinerary,
      replaceItineraries: repo.actions.replaceItineraries,
      attachRemoteMetadata: repo.actions.attachRemoteMetadata,
      updateSyncStatus: repo.actions.updateSyncStatus,
    },
    auth: userAuth,
    navigation: { navigate: () => {}, reset: () => {}, tab: () => {} },
    apiService: mockApi,
    confirm: (t, m, onConfirm) => onConfirm(),
  });

  // 2. GET bắt đầu trong lúc DELETE đang in-flight
  const fetchPromise = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAuth,
    getCurrentAuth: () => userAuth,
    apiService: mockApi,
  });

  // 3. DELETE hoàn thành 204
  resolveDelete(true);
  const delSuccess = await deletePromise;
  assert.equal(delSuccess, true);
  assert.equal(repo.getSnapshot().itineraries.length, 0);

  // 4. GET hoàn tất với snapshot cũ chứa 2701
  resolveGet([createMockRemoteItem(2701, 1, 'Lịch trình xóa B')]);
  const res = await fetchPromise;

  assert.equal(res.skipped, true);
  assert.equal(
    repo.getSnapshot().itineraries.length,
    0,
    'Must NOT resurrect item when GET started during DELETE',
  );
});

// ---------------------------------------------------------------------------
// 28. F-01 Case C: GET completing while DELETE is pending does NOT resurrect deleted item
// ---------------------------------------------------------------------------
test('28. F-01 Case C: GET completing while DELETE is pending does NOT resurrect deleted item', async () => {
  resetFetchTracker();
  const existingItem = {
    id: 'itin-del-28',
    remoteId: 2801,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình xóa C',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);
  let resolveDelete;

  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(2801, 1, 'Lịch trình xóa C')],
    deleteItinerary: async () =>
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
  };

  const userAuth = { signedIn: true, token: 'token-usr-28', user: { uid: 'usr_race_28' } };

  // 1. DELETE bắt đầu (optimistic xóa khỏi store)
  const deletePromise = orchestrateDeleteItinerary({
    id: 'itin-del-28',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: null,
      saveDraft: repo.actions.saveDraft,
      saveEdit: repo.actions.saveEdit,
      deleteItinerary: repo.actions.deleteItinerary,
      restoreItinerary: repo.actions.restoreItinerary,
      replaceItineraries: repo.actions.replaceItineraries,
      attachRemoteMetadata: repo.actions.attachRemoteMetadata,
      updateSyncStatus: repo.actions.updateSyncStatus,
    },
    auth: userAuth,
    navigation: { navigate: () => {}, reset: () => {}, tab: () => {} },
    apiService: mockApi,
    confirm: (t, m, onConfirm) => onConfirm(),
  });

  assert.equal(repo.getSnapshot().itineraries.length, 0);

  // 2. GET hoàn tất TRONG LÚC DELETE VẪN ĐANG PENDING
  const fetchResult = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAuth,
    getCurrentAuth: () => userAuth,
    apiService: mockApi,
  });

  assert.equal(fetchResult.skipped, true, 'Must skip GET when mutation is in-flight');
  assert.equal(repo.getSnapshot().itineraries.length, 0, 'Must NOT resurrect item mid-delete');

  // 3. DELETE hoàn thành
  resolveDelete(true);
  await deletePromise;
  assert.equal(repo.getSnapshot().itineraries.length, 0);
});

// ---------------------------------------------------------------------------
// 29. F-03: In-flight GET and failed DELETE rollback does NOT create duplicate remoteId
// ---------------------------------------------------------------------------
test('29. F-03: In-flight GET and failed DELETE rollback does NOT create duplicate remoteId', async () => {
  resetFetchTracker();
  const existingItem = {
    id: 'itin-del-29',
    remoteId: 2901,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình rollback',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);
  let rejectDelete;

  const mockApi = {
    fetchItineraries: async () => [createMockRemoteItem(2901, 1, 'Lịch trình rollback')],
    deleteItinerary: async () =>
      new Promise((_, reject) => {
        rejectDelete = reject;
      }),
  };

  const userAuth = { signedIn: true, token: 'token-usr-29', user: { uid: 'usr_race_29' } };

  // 1. DELETE bắt đầu (optimistic xóa)
  const deletePromise = orchestrateDeleteItinerary({
    id: 'itin-del-29',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: null,
      saveDraft: repo.actions.saveDraft,
      saveEdit: repo.actions.saveEdit,
      deleteItinerary: repo.actions.deleteItinerary,
      restoreItinerary: repo.actions.restoreItinerary,
      replaceItineraries: repo.actions.replaceItineraries,
      attachRemoteMetadata: repo.actions.attachRemoteMetadata,
      updateSyncStatus: repo.actions.updateSyncStatus,
    },
    auth: userAuth,
    navigation: { navigate: () => {}, reset: () => {}, tab: () => {} },
    apiService: mockApi,
    confirm: (t, m, onConfirm) => onConfirm(),
  });

  // 2. GET hoàn tất trong lúc DELETE đang in-flight -> Phải bị discard do activeMutations > 0!
  const getRes = await orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userAuth,
    getCurrentAuth: () => userAuth,
    apiService: mockApi,
  });
  assert.equal(getRes.skipped, true);

  // 3. DELETE thất bại -> Rollback
  rejectDelete(new ItineraryApiError('Server Error 500', 500));
  await deletePromise;

  // 4. Kiểm tra store chỉ có đúng 1 bản ghi được rollback, không duplicate remoteId
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 1, 'Store must contain exactly 1 item after rollback');
  assert.equal(items[0].remoteId, 2901);
  assert.equal(items[0].id, 'itin-del-29');
  assert.equal(items[0].syncStatus, 'error');
});

// ---------------------------------------------------------------------------
// 30. F-02: Logout and re-login of same account UID creates fresh session and does NOT reuse stale promise
// ---------------------------------------------------------------------------
test('30. F-02: Logout and re-login of same account UID creates fresh session and does NOT reuse stale promise', async () => {
  resetFetchTracker();
  let resolveS1;
  let resolveS2;
  let s1Calls = 0;
  let s2Calls = 0;

  const mockApiS1 = {
    fetchItineraries: async () => {
      s1Calls++;
      return new Promise((resolve) => {
        resolveS1 = resolve;
      });
    },
  };

  const mockApiS2 = {
    fetchItineraries: async () => {
      s2Calls++;
      return new Promise((resolve) => {
        resolveS2 = resolve;
      });
    },
  };

  const repo = createItineraryRepository([]);
  const userA_S1 = { signedIn: true, token: 'token-session-1', user: { uid: 'usr_s_30' } };

  // 1. Session 1 bắt đầu GET
  const p1 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userA_S1,
    getCurrentAuth: () => userA_S1,
    apiService: mockApiS1,
  });

  assert.equal(s1Calls, 1);

  // 2. User đăng xuất -> Invalidate session
  invalidateAuthSession('danangacy.itineraries.user.usr_s_30');

  // 3. User đăng nhập lại với Session 2 (JWT token mới)
  const userA_S2 = { signedIn: true, token: 'token-session-2', user: { uid: 'usr_s_30' } };
  const p2 = orchestrateRemoteFetchItineraries({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      reconcileRemote: repo.actions.reconcileRemote,
      setRemoteRefreshing: repo.actions.setRemoteRefreshing,
      setRemoteRefreshError: repo.actions.setRemoteRefreshError,
    },
    auth: userA_S2,
    getCurrentAuth: () => userA_S2,
    apiService: mockApiS2,
  });

  // Khẳng định Session 2 không tái sử dụng Promise của Session 1!
  assert.equal(s2Calls, 1, 'Session 2 must initiate its own fresh API call');

  // 4. Session 1 trả về muộn
  resolveS1([createMockRemoteItem(3001, 1, 'Data cũ từ Session 1')]);
  const res1 = await p1;
  assert.equal(res1.skipped, true, 'Session 1 response must be discarded');

  // 5. Session 2 trả về
  resolveS2([createMockRemoteItem(3002, 1, 'Data mới từ Session 2')]);
  const res2 = await p2;
  assert.equal(res2.success, true);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 3002);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Data mới từ Session 2');
});

// ---------------------------------------------------------------------------
// 31. F-03 Defense-in-depth: restoreItinerary enforces remoteId uniqueness
// ---------------------------------------------------------------------------
test('31. F-03 Defense-in-depth: restoreItinerary enforces remoteId uniqueness', () => {
  const existingItem = {
    id: 'itin-existing-31',
    remoteId: 3101,
    version: 1,
    syncStatus: 'synced',
    title: 'Đã có trong store',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([existingItem]);

  // Thử khôi phục một bản ghi khác nhưng cùng remoteId: 3101
  const duplicateRemote = {
    id: 'itin-duplicate-31',
    remoteId: 3101,
    version: 1,
    syncStatus: 'pending',
    title: 'Bản ghi thứ hai cùng remoteId',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const restored = repo.actions.restoreItinerary(duplicateRemote);
  assert.equal(restored, true);

  const snapshot = repo.getSnapshot().itineraries;
  assert.equal(snapshot.length, 1, 'Length must remain 1 - no duplicate remoteId appended');
  assert.equal(snapshot[0].remoteId, 3101);
  assert.equal(snapshot[0].syncStatus, 'error', 'Existing item marked error safely');
});
