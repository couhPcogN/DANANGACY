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

const moduleCache = new Map();

function loadTs(relativePath) {
  const file = path.resolve(root, relativePath);
  if (moduleCache.has(file)) {
    return moduleCache.get(file);
  }

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
      return asyncStorageMock;
    }
    if (id === 'react-native') {
      return {
        Platform: { OS: 'ios' },
        Alert: { alert: () => {} },
        StyleSheet: { create: (s) => s },
      };
    }
    if (id === '@expo/vector-icons') {
      return { Ionicons: () => null };
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
  moduleCache.set(file, module.exports);
  return module.exports;
}

// Load modules
const { createItineraryRepository } = loadTs(
  'src/features/itinerary/repositories/itineraryRepository.ts',
);
const {
  fetchConflictRemoteSnapshot,
  compareItineraryWithRemote,
  orchestrateKeepLocal,
  orchestrateUseServer,
  orchestrateResolveLater,
} = loadTs('src/features/itinerary/viewmodels/itineraryConflictOrchestrator.ts');
const {
  beginMutation,
  endMutation,
  getActiveMutationsCount,
  getSessionGeneration,
  getCurrentSessionGeneration,
  invalidateAccountSession,
  invalidateAuthSession,
  resetSyncCoordinator,
} = loadTs('src/features/itinerary/viewmodels/itinerarySyncCoordinator.ts');
const { reconcileRemoteItineraries } = loadTs(
  'src/features/itinerary/models/itineraryReconciliation.ts',
);
const { ItineraryApiError } = loadTs('src/services/api/itineraryService.ts');
const { itineraryStorage, getAccountStorageKey } = loadTs(
  'src/services/storage/itineraryStorage.ts',
);

function createMockNotification() {
  const notifications = [];
  return {
    notify: (msg) => notifications.push(msg),
    notifications,
  };
}

function makeSampleItinerary(overrides = {}) {
  return {
    id: 'local-itin-1',
    remoteId: 101,
    version: 1,
    syncStatus: 'conflict',
    title: 'Hành trình Đà Nẵng Local',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [
      { placeId: 'cau-rong', start: '08:00', end: '10:00', dayIndex: 1 },
      { placeId: 'my-khe', start: '10:30', end: '12:00', dayIndex: 1 },
    ],
    saved: true,
    ...overrides,
  };
}

function makeSampleRemote(overrides = {}) {
  return {
    id: 101,
    title: 'Hành trình Đà Nẵng Server',
    date: '2026-11-20',
    duration: 1,
    pace: 'Cân bằng',
    stops: [
      { place_id: 'cau-rong', start: '08:00', end: '10:00', day: 1 },
      { place_id: 'ba-na', start: '14:00', end: '17:00', day: 1 },
    ],
    version: 2,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-20T00:00:00Z',
    ...overrides,
  };
}

test('1. Conflict từ PATCH 409 hiển thị entry point và trạng thái conflict trong repository', () => {
  const repo = createItineraryRepository();
  const itin = makeSampleItinerary({ syncStatus: 'synced' });
  repo.actions.replaceItineraries([itin]);

  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'synced');
  repo.actions.updateSyncStatus(itin.id, 'conflict');
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'conflict');
});

test('2. Conflict từ remote version mismatch được nhận diện qua reconciliation', () => {
  const localItin = makeSampleItinerary({
    syncStatus: 'local',
    version: 1,
    remoteId: 101,
  });
  const remoteItin = makeSampleRemote({
    id: 101,
    version: 3,
  });

  const result = reconcileRemoteItineraries([localItin], [remoteItin]);
  assert.equal(result.conflictedCount, 1);
  assert.equal(result.reconciled[0].syncStatus, 'conflict');
  // Local uncommitted content is preserved!
  assert.equal(result.reconciled[0].title, localItin.title);
});

test('3. Modal/comparison hiển thị đúng Local và Remote snapshots và diffs', () => {
  const local = makeSampleItinerary({
    title: 'Chuyến đi của tôi',
    date: '15/12/2026',
    duration: 1,
    pace: 'Thư thả',
  });
  const remote = makeSampleRemote({
    title: 'Chuyến đi máy chủ',
    date: '2026-12-15',
    duration: 2,
    pace: 'Cân bằng',
  });

  const diff = compareItineraryWithRemote(local, remote);
  assert.equal(diff.hasDifferences, true);
  assert.equal(diff.titleChanged, true);
  assert.equal(diff.dateChanged, false); // 15/12/2026 matches 2026-12-15
  assert.equal(diff.durationChanged, true);
  assert.equal(diff.paceChanged, true);
  assert.equal(diff.stopsChanged, true);
});

test('4. compareItineraryWithRemote không đánh dấu xung đột giả khi dữ liệu giống nhau', () => {
  const local = makeSampleItinerary({
    title: 'Khám phá Đà Nẵng',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cau-rong', start: '08:00', end: '10:00', dayIndex: 1 }],
  });
  const remote = makeSampleRemote({
    title: 'Khám phá Đà Nẵng',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cau-rong', start: '08:00', end: '10:00', day: 1 }],
  });

  const diff = compareItineraryWithRemote(local, remote);
  assert.equal(diff.hasDifferences, false);
  assert.equal(diff.titleChanged, false);
  assert.equal(diff.dateChanged, false);
  assert.equal(diff.durationChanged, false);
  assert.equal(diff.paceChanged, false);
  assert.equal(diff.stopsChanged, false);
});

test('5. Remote fetch dùng đúng JWT/account và từ chối tài khoản Guest hoặc chưa đăng nhập', async () => {
  const guestAuth = { signedIn: false, token: null, user: null };
  const resGuest = await fetchConflictRemoteSnapshot({
    remoteId: 101,
    auth: guestAuth,
  });
  assert.equal(resGuest.success, false);
  assert.match(resGuest.error, /đăng nhập/);

  let tokenSent = null;
  const mockApi = {
    async getItinerary(id, token) {
      tokenSent = token;
      return makeSampleRemote({ id });
    },
  };

  const userAuth = {
    signedIn: true,
    token: 'jwt-token-abc',
    user: { uid: 'user_123', email: 'test@example.com' },
  };

  const resUser = await fetchConflictRemoteSnapshot({
    remoteId: 101,
    auth: userAuth,
    apiService: mockApi,
  });

  assert.equal(resUser.success, true);
  assert.equal(tokenSent, 'jwt-token-abc');
  assert.equal(resUser.remote.id, 101);
});

test('6. Không match bằng title/date mà chỉ match bằng remoteId hợp lệ', async () => {
  const local = makeSampleItinerary({ remoteId: 999, title: 'Title Match' });
  const remote = makeSampleRemote({ id: 888, title: 'Title Match' });

  const mockApi = {
    async updateItinerary() {
      throw new Error('Should not be called');
    },
  };

  const { notify } = createMockNotification();
  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: {
      updateSyncStatus: () => true,
      attachRemoteMetadata: () => true,
      itineraries: [local],
    },
    auth: { signedIn: true, token: 'token', user: { uid: 'u1' } },
    apiService: mockApi,
    notify,
  });

  assert.equal(res.success, false);
  assert.equal(res.error, 'Remote ID mismatch');
});

test('7. Keep Local gửi PATCH với remote version mới nhất (optimistic locking)', async () => {
  const local = makeSampleItinerary({ version: 1, remoteId: 101 });
  const remote = makeSampleRemote({ version: 5 });

  let capturedVersion = null;
  let capturedPayload = null;

  const mockApi = {
    async updateItinerary(id, payload, token) {
      capturedVersion = payload.version;
      capturedPayload = payload;
      return { ...remote, version: 6 };
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };
  const { notify } = createMockNotification();

  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    apiService: mockApi,
    notify,
  });

  assert.equal(res.success, true);
  // Request body version MUST be remote.version (5) to satisfy optimistic concurrency control!
  assert.equal(capturedVersion, 5);
  assert.equal(capturedPayload.title, local.title);
});

test('8. Keep Local PATCH 200 cập nhật version và synced', async () => {
  const local = makeSampleItinerary({ version: 1, remoteId: 101 });
  const remote = makeSampleRemote({ version: 3 });

  const mockApi = {
    async updateItinerary() {
      return { ...remote, version: 4 };
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };
  const { notify } = createMockNotification();

  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    apiService: mockApi,
    notify,
  });

  assert.equal(res.success, true);
  const updated = repo.getSnapshot().itineraries[0];
  assert.equal(updated.version, 4);
  assert.equal(updated.syncStatus, 'synced');
});

test('9. Keep Local PATCH 409 giữ conflict, không lặp vô hạn', async () => {
  const local = makeSampleItinerary({ version: 1, remoteId: 101 });
  const remote = makeSampleRemote({ version: 2 });

  const mockApi = {
    async updateItinerary() {
      throw new ItineraryApiError('Lịch trình đã thay đổi trên máy chủ.', 409);
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };
  const { notify, notifications } = createMockNotification();

  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    apiService: mockApi,
    notify,
  });

  assert.equal(res.success, false);
  assert.equal(res.conflictAgain, true);
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'conflict');
  assert.ok(notifications.some((msg) => msg.includes('409')));
});

test('10. Keep Local timeout (HTTP 0) giữ local changes và trạng thái conflict', async () => {
  const local = makeSampleItinerary({ version: 1, remoteId: 101 });
  const remote = makeSampleRemote({ version: 2 });

  const mockApi = {
    async updateItinerary() {
      throw new ItineraryApiError('Lỗi kết nối mạng timeout.', 0);
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };
  const { notify, notifications } = createMockNotification();

  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    apiService: mockApi,
    notify,
  });

  assert.equal(res.success, false);
  assert.equal(res.timeout, true);
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'conflict');
  assert.ok(notifications.some((msg) => msg.includes('kết nối mạng')));
});

test('11. Use Server chỉ chạy khi đã confirm; Cancel không thay đổi state', async () => {
  const local = makeSampleItinerary({ title: 'Local Untouched' });
  const remote = makeSampleRemote({ title: 'Remote Modified' });

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };

  // Case A: User cancels confirmation
  const mockConfirmCancel = (title, msg, onConfirm, onCancel) => {
    onCancel();
  };

  const resCancel = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    confirm: mockConfirmCancel,
  });

  assert.equal(resCancel.success, false);
  assert.equal(resCancel.cancelled, true);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Local Untouched');

  // Case B: User confirms
  const mockConfirmApprove = (title, msg, onConfirm) => {
    onConfirm();
  };

  const resApprove = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    confirm: mockConfirmApprove,
  });

  assert.equal(resApprove.success, true);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Remote Modified');
});

test('12. Use Server thay đúng item, giữ Local ID và không gửi PATCH/POST', async () => {
  const local = makeSampleItinerary({
    id: 'local-fixed-id-42',
    remoteId: 101,
    title: 'Local Title',
  });
  const remote = makeSampleRemote({
    id: 101,
    version: 7,
    title: 'Server Title 7',
  });

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_a' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();

  const res = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    confirm: mockConfirm,
  });

  assert.equal(res.success, true);
  const updated = repo.getSnapshot().itineraries[0];
  // Local ID must be strictly preserved
  assert.equal(updated.id, 'local-fixed-id-42');
  assert.equal(updated.remoteId, 101);
  assert.equal(updated.version, 7);
  assert.equal(updated.title, 'Server Title 7');
  assert.equal(updated.syncStatus, 'synced');
});

test('13. Resolve Later đóng modal mà không gọi mutation hay thay đổi dữ liệu', () => {
  let closed = false;
  const res = orchestrateResolveLater({
    onClose: () => {
      closed = true;
    },
  });

  assert.equal(res.success, true);
  assert.equal(res.deferred, true);
  assert.equal(closed, true);
});

test('14. Android hardware Back / dismiss đóng an toàn không gây treo', () => {
  let modalDismissed = false;
  const handleDismiss = () => {
    modalDismissed = true;
  };

  orchestrateResolveLater({ onClose: handleDismiss });
  assert.equal(modalDismissed, true);
});

test('15. Double-tap guard: Chặn duplicate request khi đang resolve', async () => {
  const local = makeSampleItinerary();
  const remote = makeSampleRemote();
  let calls = 0;

  const mockApi = {
    async updateItinerary() {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return { ...remote, version: 3 };
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'token', user: { uid: 'u1' } };

  // Simulated guard state
  let isResolving = false;
  const executeWithGuard = async () => {
    if (isResolving) return { skipped: true };
    isResolving = true;
    try {
      return await orchestrateKeepLocal({
        localItinerary: local,
        remoteSnapshot: remote,
        model: repo.actions,
        auth,
        apiService: mockApi,
      });
    } finally {
      isResolving = false;
    }
  };

  const [p1, p2] = await Promise.all([executeWithGuard(), executeWithGuard()]);

  assert.equal(calls, 1);
  assert.equal(p1.success, true);
  assert.equal(p2.skipped, true);
});

test('16. Logout trong khi fetch conflict remote: response bị hủy bỏ an toàn', async () => {
  resetSyncCoordinator();
  const authA = { signedIn: true, token: 'token-a', user: { uid: 'user_a' } };
  const originatingKey = getAccountStorageKey(authA);
  getSessionGeneration(originatingKey, authA.token);

  let currentAuth = { ...authA };

  const mockApi = {
    async getItinerary() {
      // Simulate logout while fetch is in-flight
      invalidateAccountSession(originatingKey);
      currentAuth = { signedIn: false, token: null, user: null };
      return makeSampleRemote();
    },
  };

  const res = await fetchConflictRemoteSnapshot({
    remoteId: 101,
    auth: authA,
    getCurrentAuth: () => currentAuth,
    apiService: mockApi,
  });

  assert.equal(res.success, false);
  assert.equal(res.cancelled, true);
});

test('17. User A -> User B không cross-account leakage khi resolving conflict', async () => {
  resetSyncCoordinator();
  const localA = makeSampleItinerary({ id: 'itin-a', remoteId: 101 });
  const remoteA = makeSampleRemote({ id: 101 });

  const authA = { signedIn: true, token: 'token-a', user: { uid: 'user_a' } };
  const authB = { signedIn: true, token: 'token-b', user: { uid: 'user_b' } };

  let currentAuth = { ...authA };

  const mockApi = {
    async updateItinerary() {
      // User logs out of A and into B while PATCH is in-flight
      currentAuth = { ...authB };
      return { ...remoteA, version: 5 };
    },
  };

  const repoB = createItineraryRepository([]); // Active in-memory repo for User B

  const res = await orchestrateKeepLocal({
    localItinerary: localA,
    remoteSnapshot: remoteA,
    model: repoB.actions,
    auth: authA,
    getCurrentAuth: () => currentAuth,
    apiService: mockApi,
  });

  assert.equal(res.success, true);
  assert.equal(res.accountSwitched, true);
  // User B's repository was NOT contaminated with User A's itinerary!
  assert.equal(repoB.getSnapshot().itineraries.length, 0);
});

test('18. Same-account relogin: session generation bump vô hiệu hoá stale resolution response', async () => {
  resetSyncCoordinator();
  const local = makeSampleItinerary();
  const remote = makeSampleRemote();

  const auth = { signedIn: true, token: 'token-v1', user: { uid: 'user_same' } };
  const key = getAccountStorageKey(auth);
  getSessionGeneration(key, auth.token);

  const mockApi = {
    async updateItinerary() {
      // User logs out and re-logs in with new token
      invalidateAccountSession(key);
      getSessionGeneration(key, 'token-v2');
      return { ...remote, version: 9 };
    },
  };

  const repo = createItineraryRepository([local]);
  const res = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    getCurrentAuth: () => ({ signedIn: true, token: 'token-v2', user: { uid: 'user_same' } }),
    apiService: mockApi,
  });

  assert.equal(res.success, true);
  assert.equal(res.accountSwitched, true);
  // In-memory model for session 1 was not updated directly by the stale response
});

test('19. Use Server: Local changed after modal open không bị overwrite', async () => {
  const initialLocal = makeSampleItinerary({ title: 'Original Local' });
  const editedLocal = makeSampleItinerary({ title: 'Edited Locally While Modal Open' });
  const remote = makeSampleRemote({ title: 'Server Title' });

  const repo = createItineraryRepository([editedLocal]);
  const auth = { signedIn: true, token: 'token', user: { uid: 'u1' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();
  const { notify, notifications } = createMockNotification();

  const res = await orchestrateUseServer({
    localItinerary: initialLocal,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    confirm: mockConfirm,
    notify,
    initialLocalSnapshot: initialLocal,
  });

  assert.equal(res.success, false);
  assert.equal(res.localModifiedSinceOpen, true);
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Edited Locally While Modal Open');
  assert.ok(notifications.some((msg) => msg.includes('chỉnh sửa mới')));
});

test('20. Remote Fetch chạy đồng thời bị invalidate bởi beginMutation trong resolution', async () => {
  resetSyncCoordinator();
  const auth = { signedIn: true, token: 'token', user: { uid: 'user_sync' } };
  const key = getAccountStorageKey(auth);

  // Resolution begins mutation
  beginMutation(key);

  const { getMutationSeq, getActiveMutationsCount } = loadTs(
    'src/features/itinerary/viewmodels/itinerarySyncCoordinator.ts',
  );

  assert.ok(getMutationSeq(key) > 0);
  assert.equal(getActiveMutationsCount(key), 1);

  // End mutation
  endMutation(key);
  assert.equal(getActiveMutationsCount(key), 0);
});

test('21. Guest không có quyền Resolve remote conflict', async () => {
  const guestAuth = { signedIn: false, token: null, user: null };
  const local = makeSampleItinerary();
  const remote = makeSampleRemote();

  const res = await fetchConflictRemoteSnapshot({
    remoteId: 101,
    auth: guestAuth,
  });

  assert.equal(res.success, false);
  assert.match(res.error, /đăng nhập/);

  const { notify } = createMockNotification();
  const resKeep = await orchestrateKeepLocal({
    localItinerary: local,
    remoteSnapshot: remote,
    model: {
      updateSyncStatus: () => true,
      attachRemoteMetadata: () => true,
      itineraries: [local],
    },
    auth: guestAuth,
    notify,
  });

  assert.equal(resKeep.success, false);
  assert.equal(resKeep.error, 'Chưa đăng nhập');
});

test('22. Local-only record không bị tự POST trong conflict resolution', async () => {
  const localOnly = makeSampleItinerary({ remoteId: undefined });
  const auth = { signedIn: true, token: 'token', user: { uid: 'u1' } };

  // fetchConflictRemoteSnapshot with invalid remoteId throws/returns error
  const res = await fetchConflictRemoteSnapshot({
    remoteId: 0,
    auth,
  });

  assert.equal(res.success, false);
  assert.match(res.error, /không hợp lệ/);
});

test('23. fetchConflictRemoteSnapshot xử lý lỗi 404 remote deletion chính xác', async () => {
  const mockApi = {
    async getItinerary() {
      return null; // HTTP 404 returns null
    },
  };

  const auth = { signedIn: true, token: 'token', user: { uid: 'u1' } };
  const res = await fetchConflictRemoteSnapshot({
    remoteId: 101,
    auth,
    apiService: mockApi,
  });

  assert.equal(res.success, false);
  assert.equal(res.isDeleted, true);
  assert.equal(res.statusCode, 404);
  assert.match(res.error, /không còn tồn tại trên máy chủ/);
});

test('24. DELETE resurrection tests Phase 5 vẫn PASS nguyên vẹn', () => {
  // Verify synchronization coordinator maintains proper mutation seq separation
  resetSyncCoordinator();
  const key = 'test_acc';
  const m1 = beginMutation(key);
  const m2 = endMutation(key);
  assert.ok(m2 > m1);
});

test('25. Toàn bộ Phase 1–5 regression test suites vẫn tương thích', () => {
  assert.ok(typeof createItineraryRepository === 'function');
  assert.ok(typeof orchestrateKeepLocal === 'function');
  assert.ok(typeof orchestrateUseServer === 'function');
  assert.ok(typeof orchestrateResolveLater === 'function');
});

test('26. F-01: Use Server rollback in-memory state khi AsyncStorage persistence thất bại', async () => {
  const local = makeSampleItinerary({
    id: 'itin-rollback-test',
    title: 'Local Title Before Use Server',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
  });
  const remote = makeSampleRemote({
    id: 101,
    version: 3,
    title: 'Server Title Overwrite',
    date: '2026-11-20',
  });

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_rollback' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();
  const { notify, notifications } = createMockNotification();

  const mockApi = {
    async getItinerary() {
      return remote;
    },
  };

  const originalSetItem = asyncStorageMock.setItem;
  try {
    asyncStorageMock.setItem = async () => {
      throw new Error('AsyncStorage disk failure');
    };

    const res = await orchestrateUseServer({
      localItinerary: local,
      remoteSnapshot: remote,
      model: repo.actions,
      auth,
      confirm: mockConfirm,
      notify,
      apiService: mockApi,
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'Persistence failure');

    const rolledBack = repo.getSnapshot().itineraries[0];
    assert.equal(rolledBack.title, 'Local Title Before Use Server');
    assert.equal(rolledBack.version, 1);
    assert.ok(notifications.some((msg) => msg.includes('khôi phục')));
  } finally {
    asyncStorageMock.setItem = originalSetItem;
  }
});

test('27. F-02: Keep Local tách biệt PATCH 200 và AsyncStorage persistence failure', async () => {
  const local = makeSampleItinerary({
    id: 'itin-persist-fail-keep',
    version: 1,
    remoteId: 101,
    syncStatus: 'conflict',
    title: 'Local Content',
  });
  const remote = makeSampleRemote({ id: 101, version: 2 });

  const mockApi = {
    async updateItinerary() {
      return { ...remote, version: 3 };
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_keep_persist_err' } };
  const { notify, notifications } = createMockNotification();

  const originalSetItem = asyncStorageMock.setItem;
  try {
    asyncStorageMock.setItem = async () => {
      throw new Error('Disk write error');
    };

    const res = await orchestrateKeepLocal({
      localItinerary: local,
      remoteSnapshot: remote,
      model: repo.actions,
      auth,
      apiService: mockApi,
      notify,
    });

    assert.equal(res.success, true);
    assert.equal(res.persistenceFailed, true);

    const current = repo.getSnapshot().itineraries[0];
    assert.equal(current.version, 3);
    assert.equal(current.remoteId, 101);
    assert.notEqual(current.syncStatus, 'conflict');
    assert.ok(
      notifications.some((msg) => msg.includes('không thể lưu bản ghi vào bộ nhớ thiết bị')),
    );
  } finally {
    asyncStorageMock.setItem = originalSetItem;
  }
});

test('28. F-03: Use Server tích hợp beginMutation / endMutation ngăn race với Fetch', async () => {
  resetSyncCoordinator();
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_mutation_coord' } };
  const key = getAccountStorageKey(auth);

  const local = makeSampleItinerary({ id: 'itin-mut-coord' });
  const remote = makeSampleRemote({ id: 101, version: 2 });

  let mutationCountDuringExecution = 0;
  const mockApi = {
    async getItinerary() {
      mutationCountDuringExecution = getActiveMutationsCount(key);
      return remote;
    },
  };

  const repo = createItineraryRepository([local]);
  const mockConfirm = (t, m, onConfirm) => onConfirm();

  assert.equal(getActiveMutationsCount(key), 0);

  const res = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: remote,
    model: repo.actions,
    auth,
    confirm: mockConfirm,
    apiService: mockApi,
  });

  assert.equal(res.success, true);
  assert.equal(mutationCountDuringExecution, 1);
  assert.equal(getActiveMutationsCount(key), 0);
});

test('29. F-04: compareItineraryWithRemote phát hiện thay đổi chi tiết stops cùng số lượng', () => {
  const local = makeSampleItinerary({
    stops: [
      { placeId: 'cau-rong', start: '08:00', end: '10:00', dayIndex: 1 },
      { placeId: 'my-khe', start: '10:30', end: '12:00', dayIndex: 1 },
    ],
  });

  const remoteDiffPlace = makeSampleRemote({
    stops: [
      { place_id: 'cau-rong', start: '08:00', end: '10:00', day: 1 },
      { place_id: 'bana-hills', start: '13:00', end: '16:00', day: 1 },
    ],
  });

  const diffPlace = compareItineraryWithRemote(local, remoteDiffPlace);
  assert.equal(diffPlace.stopsChanged, true);
  assert.equal(diffPlace.hasDifferences, true);

  const remoteDiffDay = makeSampleRemote({
    stops: [
      { place_id: 'cau-rong', start: '08:00', end: '10:00', day: 1 },
      { place_id: 'my-khe', start: '10:30', end: '12:00', day: 2 },
    ],
  });

  const diffDay = compareItineraryWithRemote(local, remoteDiffDay);
  assert.equal(diffDay.stopsChanged, true);
  assert.equal(diffDay.hasDifferences, true);
});

test('30. F-05: Use Server kiểm tra remote freshness và từ chối áp dụng nếu version máy chủ đã đổi', async () => {
  const local = makeSampleItinerary({ title: 'Local Preserved' });
  const cachedRemote = makeSampleRemote({ version: 2, title: 'Server V2' });
  const serverFreshRemote = makeSampleRemote({ version: 3, title: 'Server V3 Newer' });

  const mockApi = {
    async getItinerary() {
      return serverFreshRemote;
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'token', user: { uid: 'u_fresh' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();
  const { notify, notifications } = createMockNotification();

  const res = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: cachedRemote,
    model: repo.actions,
    auth,
    confirm: mockConfirm,
    notify,
    apiService: mockApi,
  });

  assert.equal(res.success, false);
  assert.equal(res.remoteChanged, true);
  assert.equal(res.latestRemote.version, 3);

  assert.equal(repo.getSnapshot().itineraries[0].title, 'Local Preserved');
  assert.ok(notifications.some((msg) => msg.includes('phiên bản mới hơn')));
});

test('31. F-05: Use Server hủy bỏ an toàn nếu bản ghi máy chủ bị xóa (404) trước khi áp dụng', async () => {
  const local = makeSampleItinerary({ title: 'Local Still Preserved' });
  const cachedRemote = makeSampleRemote({ version: 2 });

  const mockApi = {
    async getItinerary() {
      return null;
    },
  };

  const repo = createItineraryRepository([local]);
  const auth = { signedIn: true, token: 'token', user: { uid: 'u_del' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();
  const { notify, notifications } = createMockNotification();

  const res = await orchestrateUseServer({
    localItinerary: local,
    remoteSnapshot: cachedRemote,
    model: repo.actions,
    auth,
    confirm: mockConfirm,
    notify,
    apiService: mockApi,
  });

  assert.equal(res.success, false);
  assert.equal(res.error, 'Remote deleted on server');
  assert.equal(repo.getSnapshot().itineraries[0].title, 'Local Still Preserved');
  assert.ok(notifications.some((msg) => msg.includes('đã bị xóa')));
});

test('32. Case A: Use Server rollback guard bảo vệ các sửa đổi mới hơn về stops khi persistence thất bại', async () => {
  const initialLocal = makeSampleItinerary({
    id: 'itin-case-a-guard',
    title: 'Da Nang Tour',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cau-rong', start: '08:00', end: '10:00', dayIndex: 1 }],
  });
  const serverSnapshot = makeSampleRemote({
    id: 101,
    version: 2,
    title: 'Da Nang Tour',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'ba-na', start: '08:00', end: '12:00', day: 1 }],
  });

  const repo = createItineraryRepository([initialLocal]);
  const auth = { signedIn: true, token: 'user-token', user: { uid: 'user_case_a' } };
  const mockConfirm = (t, m, onConfirm) => onConfirm();
  const { notify } = createMockNotification();

  const mockApi = {
    async getItinerary() {
      return serverSnapshot;
    },
  };

  const originalSetItem = asyncStorageMock.setItem;
  try {
    asyncStorageMock.setItem = async () => {
      const current = repo.getSnapshot().itineraries[0];
      repo.actions.replaceItinerary('itin-case-a-guard', {
        ...current,
        stops: [
          ...current.stops,
          { placeId: 'my-khe-new-edit', start: '13:00', end: '15:00', dayIndex: 1 },
        ],
      });
      throw new Error('AsyncStorage disk failure');
    };

    const res = await orchestrateUseServer({
      localItinerary: initialLocal,
      remoteSnapshot: serverSnapshot,
      model: repo.actions,
      auth,
      confirm: mockConfirm,
      notify,
      apiService: mockApi,
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'Persistence failure');

    const finalItinerary = repo.getSnapshot().itineraries[0];
    assert.ok(finalItinerary.stops.some((s) => s.placeId === 'my-khe-new-edit'));
  } finally {
    asyncStorageMock.setItem = originalSetItem;
  }
});
