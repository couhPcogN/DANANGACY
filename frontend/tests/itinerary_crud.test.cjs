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

// React Native mock for Alert and Platform
const alertCalls = [];
let mockConfirmChoice = 'confirm'; // 'confirm', 'cancel', or 'dismiss'

const reactNativeMock = {
  Platform: { OS: 'ios' },
  Alert: {
    alert(title, message, buttons, options) {
      alertCalls.push({ title, message, buttons, options });
      if (mockConfirmChoice === 'dismiss') {
        if (options && typeof options.onDismiss === 'function') {
          options.onDismiss();
        }
        return;
      }
      if (Array.isArray(buttons)) {
        if (mockConfirmChoice === 'confirm') {
          const confirmBtn = buttons.find((b) => b.text === 'Xóa' || b.style === 'destructive');
          if (confirmBtn && typeof confirmBtn.onPress === 'function') {
            confirmBtn.onPress();
          }
        } else {
          const cancelBtn = buttons.find((b) => b.text === 'Hủy' || b.style === 'cancel');
          if (cancelBtn && typeof cancelBtn.onPress === 'function') {
            cancelBtn.onPress();
          }
        }
      }
    },
  },
};

function loadTs(relativePath) {
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

// Nạp modules
const { createItineraryRepository } = loadTs(
  'src/features/itinerary/repositories/itineraryRepository.ts',
);
const {
  orchestrateCreateItinerary,
  orchestrateUpdateItinerary,
  orchestrateDeleteItinerary,
  defaultConfirm,
} = loadTs('src/features/itinerary/viewmodels/itineraryCrudOrchestrator.ts');
const { ItineraryApiError } = loadTs('src/services/api/itineraryService.ts');
const { itineraryStorage } = loadTs('src/services/storage/itineraryStorage.ts');

function createMockNavigation() {
  const navigated = [];
  const resetRoutes = [];
  const tabCalls = [];
  return {
    navigate: (screen, id) => navigated.push({ screen, id }),
    reset: (route) => resetRoutes.push(route),
    tab: (tabName) => tabCalls.push(tabName),
    navigated,
    resetRoutes,
    tabCalls,
  };
}

// ---------------------------------------------------------------------------
// 1. Guest Create: Local-only, no API call, no remoteId/version, syncStatus='local'
// ---------------------------------------------------------------------------
test('1. Guest Create: Saves draft locally with syncStatus="local", no API call, no fake remoteId', async () => {
  storageMap.clear();
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    createItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called for Guest');
    },
  };

  repo.actions.setDraft({
    id: 'draft-guest-1',
    title: 'Hành trình khám phá Ngũ Hành Sơn',
    date: '25/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'ngu-hanh-son', start: '09:00', end: '11:00', dayIndex: 1 }],
    saved: false,
  });

  const guestAuth = { signedIn: false, token: null, user: null };

  const saved = await orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: guestAuth,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false, 'API must not be called for Guest');
  assert.ok(saved);
  assert.equal(saved.syncStatus, 'local');
  assert.equal(saved.remoteId, undefined);
  assert.equal(saved.version, undefined);
  assert.equal(nav.navigated.length, 1);
  assert.equal(nav.navigated[0].screen, 'itinerarySaved');
  assert.equal(notifications.includes('Đã lưu lịch trình trên thiết bị.'), true);

  const itineraries = repo.getSnapshot().itineraries;
  assert.equal(itineraries.length, 1);
  assert.equal(itineraries[0].syncStatus, 'local');
  assert.equal(itineraries[0].remoteId, undefined);
});

// ---------------------------------------------------------------------------
// 2. Guest Update: Local edit only, no PATCH call
// ---------------------------------------------------------------------------
test('2. Guest Update: Updates itinerary locally, no PATCH call made', async () => {
  const initialItin = {
    id: 'guest-itin-1',
    title: 'Lịch trình ban đầu',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:30', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    updateItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called');
    },
  };

  repo.actions.startEdit('guest-itin-1');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Lịch trình đã sửa đổi tên',
  });

  const guestAuth = { signedIn: false, token: null, user: null };

  const editedId = await orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: guestAuth,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(editedId, 'guest-itin-1');
  const updated = repo.getSnapshot().itineraries.find((i) => i.id === 'guest-itin-1');
  assert.equal(updated.title, 'Lịch trình đã sửa đổi tên');
  assert.equal(updated.remoteId, undefined);
  assert.equal(nav.resetRoutes.length, 1);
  assert.equal(nav.resetRoutes[0].name, 'itineraryDetail');
});

// ---------------------------------------------------------------------------
// 3. Guest Delete: Deletes locally, no DELETE API call
// ---------------------------------------------------------------------------
test('3. Guest Delete: Deletes locally with confirmation, no DELETE API call', async () => {
  const initialItin = {
    id: 'guest-itin-del',
    title: 'Xóa lịch trình này',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:30', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    deleteItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called');
    },
  };

  mockConfirmChoice = 'confirm';
  const guestAuth = { signedIn: false, token: null, user: null };

  await orchestrateDeleteItinerary({
    id: 'guest-itin-del',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: guestAuth,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(repo.getSnapshot().itineraries.length, 0);
  assert.equal(nav.tabCalls.includes('itinerary'), true);
  assert.equal(notifications.includes('Đã xóa lịch trình thành công.'), true);
});

// ---------------------------------------------------------------------------
// 4. Auth Create Success: Calls POST, attaches remoteId & version, syncStatus='synced'
// ---------------------------------------------------------------------------
test('4. Auth Create Success: Calls POST API, attaches remoteId & version, sets syncStatus="synced"', async () => {
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();
  const notifications = [];

  let postPayload = null;
  let postToken = null;

  const mockApi = {
    createItinerary: async (payload, token) => {
      postPayload = payload;
      postToken = token;
      return {
        id: 999,
        title: payload.title,
        date: payload.date,
        duration: payload.duration,
        pace: payload.pace,
        stops: payload.stops,
        version: 1,
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-20T10:00:00Z',
      };
    },
  };

  repo.actions.setDraft({
    id: 'draft-auth-1',
    title: 'Một ngày biển Mỹ Khê',
    date: '21/11/2026',
    duration: 1,
    pace: 'Năng động',
    stops: [{ placeId: 'my-khe', start: '06:00', end: '08:00', dayIndex: 1 }],
    saved: false,
  });

  const authUser = {
    signedIn: true,
    token: 'jwt-auth-token-123',
    user: { uid: 'usr_valid_42', email: 'test@danangacy.vn', display_name: 'Nguyen Van A' },
  };

  await orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.ok(postPayload);
  assert.equal(postPayload.title, 'Một ngày biển Mỹ Khê');
  assert.equal(postPayload.date, '2026-11-21');
  assert.equal(postToken, 'jwt-auth-token-123');

  const itineraries = repo.getSnapshot().itineraries;
  assert.equal(itineraries.length, 1);
  assert.equal(itineraries[0].remoteId, 999);
  assert.equal(itineraries[0].version, 1);
  assert.equal(itineraries[0].syncStatus, 'synced');
  assert.equal(notifications.includes('Đã lưu và đồng bộ lịch trình thành công.'), true);
});

// ---------------------------------------------------------------------------
// 5. Auth Create Validation Failure: Invalid stop dayIndex sets syncStatus='error'
// ---------------------------------------------------------------------------
test('5. Auth Create Validation Failure: Sets syncStatus="error", does not call POST API', async () => {
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    createItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called');
    },
  };

  // Duration = 1, but stop has dayIndex = 2 -> mapping will throw validation error
  repo.actions.setDraft({
    id: 'draft-invalid-day',
    title: 'Lịch trình lỗi ngày',
    date: '22/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 2 }],
    saved: false,
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_1', email: 'u1@test.vn', display_name: 'U1' },
  };

  await orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 1);
  assert.equal(items[0].syncStatus, 'error');
  assert.equal(items[0].remoteId, undefined);
  assert.ok(notifications.some((m) => m.includes('vượt quá thời lượng lịch trình')));
});

// ---------------------------------------------------------------------------
// 6. Auth Create Network Failure: Retains local draft, sets syncStatus='error'
// ---------------------------------------------------------------------------
test('6. Auth Create Network Failure: Retains local draft, syncStatus="error", no fake remoteId', async () => {
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();
  const notifications = [];

  const mockApi = {
    createItinerary: async () => {
      throw new ItineraryApiError('Lỗi kết nối mạng khi tạo lịch trình.', 0);
    },
  };

  repo.actions.setDraft({
    id: 'draft-net-err',
    title: 'Lịch trình mạng chập chờn',
    date: '23/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '09:00', end: '10:00', dayIndex: 1 }],
    saved: false,
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_2', email: 'u2@test.vn', display_name: 'U2' },
  };

  await orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 1);
  assert.equal(items[0].syncStatus, 'error');
  assert.equal(items[0].remoteId, undefined);
  assert.equal(items[0].version, undefined);
  assert.ok(notifications.some((m) => m.includes('Lỗi kết nối mạng')));
});

// ---------------------------------------------------------------------------
// 7. Auth Update Success: Calls PATCH with version in body, updates version & syncStatus
// ---------------------------------------------------------------------------
test('7. Auth Update Success: Calls PATCH with version, updates version to 2 and syncStatus="synced"', async () => {
  const initialItin = {
    id: 'remote-itin-1',
    remoteId: 505,
    version: 1,
    syncStatus: 'synced',
    title: 'Bản gốc',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let patchId = null;
  let patchPayload = null;

  const mockApi = {
    updateItinerary: async (id, payload) => {
      patchId = id;
      patchPayload = payload;
      return {
        id: 505,
        title: payload.title,
        date: payload.date,
        duration: payload.duration,
        pace: payload.pace,
        stops: payload.stops,
        version: 2,
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-20T10:30:00Z',
      };
    },
  };

  repo.actions.startEdit('remote-itin-1');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Bản đã chỉnh sửa tên',
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_3', email: 'u3@test.vn', display_name: 'U3' },
  };

  const editedId = await orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(editedId, 'remote-itin-1');
  assert.equal(patchId, 505);
  assert.equal(patchPayload.version, 1, 'Must send existing version for optimistic locking');
  assert.equal(patchPayload.title, 'Bản đã chỉnh sửa tên');

  const updated = repo.getSnapshot().itineraries.find((i) => i.id === 'remote-itin-1');
  assert.equal(updated.version, 2, 'Version must be incremented by backend response');
  assert.equal(updated.syncStatus, 'synced');
  assert.equal(notifications.includes('Đã đồng bộ cập nhật lịch trình thành công.'), true);
});

// ---------------------------------------------------------------------------
// 8. Auth Update Conflict (HTTP 409): Keeps local edits, sets syncStatus='conflict'
// ---------------------------------------------------------------------------
test('8. Auth Update Conflict (HTTP 409): Retains local edits, sets syncStatus="conflict"', async () => {
  const initialItin = {
    id: 'conflict-itin-1',
    remoteId: 606,
    version: 1,
    syncStatus: 'synced',
    title: 'Trước xung đột',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  const mockApi = {
    updateItinerary: async () => {
      throw new ItineraryApiError(
        'Lịch trình đã thay đổi trên máy chủ. Hãy tải lại trước khi sửa.',
        409,
      );
    },
  };

  repo.actions.startEdit('conflict-itin-1');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Sửa đổi cục bộ của tôi',
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_4', email: 'u4@test.vn', display_name: 'U4' },
  };

  await orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries.find((i) => i.id === 'conflict-itin-1');
  assert.equal(item.title, 'Sửa đổi cục bộ của tôi', 'Local edits must be retained');
  assert.equal(item.syncStatus, 'conflict', 'SyncStatus must become conflict');
  assert.ok(notifications.some((m) => m.includes('Xung đột phiên bản')));
});

// ---------------------------------------------------------------------------
// 9. Auth Update Network/Server Error: Keeps local edits, sets syncStatus='error'
// ---------------------------------------------------------------------------
test('9. Auth Update Network Error: Retains local edits, sets syncStatus="error"', async () => {
  const initialItin = {
    id: 'err-itin-1',
    remoteId: 707,
    version: 1,
    syncStatus: 'synced',
    title: 'Trước khi lỗi mạng',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  const mockApi = {
    updateItinerary: async () => {
      throw new ItineraryApiError('Lỗi kết nối mạng khi cập nhật lịch trình.', 0);
    },
  };

  repo.actions.startEdit('err-itin-1');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Sửa đổi nhưng mất mạng',
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_5', email: 'u5@test.vn', display_name: 'U5' },
  };

  await orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  const item = repo.getSnapshot().itineraries.find((i) => i.id === 'err-itin-1');
  assert.equal(item.title, 'Sửa đổi nhưng mất mạng');
  assert.equal(item.syncStatus, 'error');
  assert.ok(notifications.some((m) => m.includes('Lỗi kết nối mạng') || m.includes('Lỗi đồng bộ')));
});

// ---------------------------------------------------------------------------
// 10. Auth Update Local-Only Item in Auth Partition: Does NOT call PATCH API
// ---------------------------------------------------------------------------
test('10. Auth Update Local-Only Item: Stays local and does NOT call PATCH API', async () => {
  const localOnlyAuthItin = {
    id: 'local-in-auth-partition',
    // remoteId is undefined!
    title: 'Bản lưu nháp trên tài khoản',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };
  const repo = createItineraryRepository([localOnlyAuthItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    updateItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called');
    },
  };

  repo.actions.startEdit('local-in-auth-partition');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Cập nhật bản nháp',
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_6', email: 'u6@test.vn', display_name: 'U6' },
  };

  await orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  const item = repo.getSnapshot().itineraries.find((i) => i.id === 'local-in-auth-partition');
  assert.equal(item.title, 'Cập nhật bản nháp');
  assert.equal(item.remoteId, undefined);
  assert.equal(notifications.includes('Đã cập nhật lịch trình trên thiết bị.'), true);
});

// ---------------------------------------------------------------------------
// 11. Auth Delete Local-Only Item: Deletes locally, does NOT call DELETE API
// ---------------------------------------------------------------------------
test('11. Auth Delete Local-Only Item: Deletes locally, does NOT call DELETE API', async () => {
  const localItin = {
    id: 'auth-local-del-1',
    title: 'Xóa nháp tài khoản',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
    syncStatus: 'local',
  };
  const repo = createItineraryRepository([localItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    deleteItinerary: async () => {
      apiCalled = true;
      throw new Error('Should not be called');
    },
  };

  mockConfirmChoice = 'confirm';
  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_7', email: 'u7@test.vn', display_name: 'U7' },
  };

  await orchestrateDeleteItinerary({
    id: 'auth-local-del-1',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(repo.getSnapshot().itineraries.length, 0);
  assert.equal(nav.tabCalls.includes('itinerary'), true);
});

// ---------------------------------------------------------------------------
// 12. Auth Delete Remote Success: Passes target.remoteId (NOT local UUID), deletes record
// ---------------------------------------------------------------------------
test('12. Auth Delete Remote Success: Calls DELETE API with remoteId, removes from repository', async () => {
  const remoteItin = {
    id: 'local-uuid-abc-123',
    remoteId: 888,
    version: 3,
    syncStatus: 'synced',
    title: 'Xóa từ máy chủ',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([remoteItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let deletedRemoteId = null;
  let deletedToken = null;

  const mockApi = {
    deleteItinerary: async (id, token) => {
      deletedRemoteId = id;
      deletedToken = token;
    },
  };

  mockConfirmChoice = 'confirm';
  const authUser = {
    signedIn: true,
    token: 'token-auth-delete',
    user: { uid: 'usr_8', email: 'u8@test.vn', display_name: 'U8' },
  };

  await orchestrateDeleteItinerary({
    id: 'local-uuid-abc-123',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(deletedRemoteId, 888, 'MUST pass remoteId (888), NOT local id string or parseInt');
  assert.equal(deletedToken, 'token-auth-delete');
  assert.equal(repo.getSnapshot().itineraries.length, 0);
  assert.equal(notifications.includes('Đã xóa lịch trình thành công.'), true);
});

// ---------------------------------------------------------------------------
// 13. Auth Delete Remote Rollback on Failure: Restores record with syncStatus='error'
// ---------------------------------------------------------------------------
test('13. Auth Delete Remote Failure: Rolls back snapshot into repository with syncStatus="error"', async () => {
  const remoteItin = {
    id: 'local-uuid-rollback',
    remoteId: 999,
    version: 2,
    syncStatus: 'synced',
    title: 'Không thể xóa',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([remoteItin]);
  const nav = createMockNavigation();
  const notifications = [];

  const mockApi = {
    deleteItinerary: async () => {
      throw new ItineraryApiError('Lỗi máy chủ nội bộ khi xóa lịch trình (HTTP 500).', 500);
    },
  };

  mockConfirmChoice = 'confirm';
  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_9', email: 'u9@test.vn', display_name: 'U9' },
  };

  await orchestrateDeleteItinerary({
    id: 'local-uuid-rollback',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  // Đã rollback lại vào repository
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'local-uuid-rollback');
  assert.equal(items[0].remoteId, 999);
  assert.equal(items[0].syncStatus, 'error', 'Rolled back record must have syncStatus="error"');
  assert.ok(notifications.some((m) => m.includes('Không thể xóa lịch trình trên máy chủ')));
});

// ---------------------------------------------------------------------------
// 14. Auth Delete Confirmation Cancellation: Cancel does NOT delete
// ---------------------------------------------------------------------------
test('14. Auth Delete Prompt: Choosing cancel preserves itinerary and does not call API', async () => {
  const remoteItin = {
    id: 'itin-keep-me',
    remoteId: 111,
    version: 1,
    syncStatus: 'synced',
    title: 'Giữ lại lịch trình',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([remoteItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let apiCalled = false;
  const mockApi = {
    deleteItinerary: async () => {
      apiCalled = true;
    },
  };

  mockConfirmChoice = 'cancel'; // Người dùng bấm Hủy
  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_10', email: 'u10@test.vn', display_name: 'U10' },
  };

  await orchestrateDeleteItinerary({
    id: 'itin-keep-me',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  assert.equal(apiCalled, false);
  assert.equal(repo.getSnapshot().itineraries.length, 1);
  assert.equal(repo.getSnapshot().itineraries[0].id, 'itin-keep-me');
});

// ---------------------------------------------------------------------------
// 15. Account Switch During Create: Response for User A does NOT contaminate User B
// ---------------------------------------------------------------------------
test('15. Account Switch During Create: Response for User A persists to User A storage, never into User B model', async () => {
  storageMap.clear();

  // Model của User A lúc khởi tạo
  const repoUserA = createItineraryRepository([]);
  const nav = createMockNavigation();

  let resolveApi;
  const mockApi = {
    createItinerary: () =>
      new Promise((resolve) => {
        resolveApi = resolve;
      }),
  };

  repoUserA.actions.setDraft({
    id: 'itin-created-by-user-a',
    title: 'Lịch trình riêng của User A',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: false,
  });

  const userAAuth = {
    signedIn: true,
    token: 'token-user-a',
    user: { uid: 'usr_alpha', email: 'a@test.vn', display_name: 'User A' },
  };

  // Giả lập trạng thái auth chuyển sang User B khi API đang in-flight
  let currentAuth = userAAuth;

  const createPromise = orchestrateCreateItinerary({
    model: {
      itineraries: repoUserA.getSnapshot().itineraries,
      draft: repoUserA.getSnapshot().draft,
      editingId: repoUserA.getSnapshot().editingId,
      ...repoUserA.actions,
    },
    auth: userAAuth,
    navigation: nav,
    getCurrentAuth: () => currentAuth,
    apiService: mockApi,
  });

  // Chuyển sang User B
  const userBAuth = {
    signedIn: true,
    token: 'token-user-b',
    user: { uid: 'usr_beta', email: 'b@test.vn', display_name: 'User B' },
  };
  currentAuth = userBAuth;

  // Khởi tạo model User B
  const repoUserB = createItineraryRepository([]);
  assert.equal(repoUserB.getSnapshot().itineraries.length, 0);

  // API User A trả về phản hồi
  resolveApi({
    id: 1234,
    title: 'Lịch trình riêng của User A',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
    version: 1,
  });

  const savedA = await createPromise;

  // 1. Kiểm tra Model User B tuyệt đối KHÔNG có lịch trình của User A
  assert.equal(
    repoUserB.getSnapshot().itineraries.length,
    0,
    'User B model must remain clean and empty',
  );

  // 2. Kiểm tra Vùng lưu trữ của User A được cập nhật bền vững
  const storedUserA = await itineraryStorage.loadItinerariesForAccount(userAAuth);
  assert.ok(
    storedUserA.some((i) => i.id === savedA.id && i.remoteId === 1234),
    'User A storage must contain the created item with remoteId',
  );
});

// ---------------------------------------------------------------------------
// 16. Account Switch During Delete Failure: Rollback does NOT contaminate User B
// ---------------------------------------------------------------------------
test('16. Account Switch During Delete Failure: Rollback persists to User A storage, never into User B model', async () => {
  storageMap.clear();

  const userAItin = {
    id: 'itin-del-user-a',
    remoteId: 5555,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình cần xóa của User A',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repoUserA = createItineraryRepository([userAItin]);
  const nav = createMockNavigation();

  let rejectApi;
  const mockApi = {
    deleteItinerary: () =>
      new Promise((_, reject) => {
        rejectApi = reject;
      }),
  };

  const userAAuth = {
    signedIn: true,
    token: 'token-user-a',
    user: { uid: 'usr_alpha_2', email: 'a2@test.vn', display_name: 'User A2' },
  };

  let currentAuth = userAAuth;
  mockConfirmChoice = 'confirm';

  const deletePromise = orchestrateDeleteItinerary({
    id: 'itin-del-user-a',
    model: {
      itineraries: repoUserA.getSnapshot().itineraries,
      draft: repoUserA.getSnapshot().draft,
      editingId: repoUserA.getSnapshot().editingId,
      ...repoUserA.actions,
    },
    auth: userAAuth,
    navigation: nav,
    getCurrentAuth: () => currentAuth,
    apiService: mockApi,
  });

  // Chuyển sang User B
  const userBAuth = {
    signedIn: true,
    token: 'token-user-b',
    user: { uid: 'usr_beta_2', email: 'b2@test.vn', display_name: 'User B2' },
  };
  currentAuth = userBAuth;

  const repoUserB = createItineraryRepository([]);

  // API DELETE gặp lỗi 500
  rejectApi(new ItineraryApiError('Server error', 500));

  await deletePromise;

  // 1. Kiểm tra Model User B không nhận bản ghi rollback
  assert.equal(repoUserB.getSnapshot().itineraries.length, 0);

  // 2. Bản ghi được rollback an toàn vào storage của User A với syncStatus="error"
  const storedUserA = await itineraryStorage.loadItinerariesForAccount(userAAuth);
  assert.ok(
    storedUserA.some((i) => i.id === 'itin-del-user-a' && i.syncStatus === 'error'),
    'User A storage must receive rolled back item',
  );
});

// ---------------------------------------------------------------------------
// 17. Client Never Generates Fake RemoteId or Version
// ---------------------------------------------------------------------------
test('17. No Fake Remote IDs or Versions generated on client', async () => {
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();

  // Create as Guest
  repo.actions.setDraft({
    id: 'client-fake-check-1',
    title: 'Kiểm tra fake ID',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: false,
  });

  const savedGuest = await orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: { signedIn: false, token: null, user: null },
    navigation: nav,
  });

  assert.equal(savedGuest.remoteId, undefined);
  assert.equal(savedGuest.version, undefined);
  assert.equal(typeof savedGuest.id, 'string');
  assert.ok(savedGuest.id.startsWith('itinerary-'));
});

// ---------------------------------------------------------------------------
// 18. F-01: DELETE HTTP 404 does NOT rollback and finalizes local delete
// ---------------------------------------------------------------------------
test('18. F-01: DELETE HTTP 404 does not rollback and resolves true per user intent', async () => {
  const remoteItin = {
    id: 'itin-404-check',
    remoteId: 4041,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình bị xóa trên máy chủ',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([remoteItin]);
  const nav = createMockNavigation();
  const notifications = [];

  const mockApi = {
    deleteItinerary: async () => {
      throw new ItineraryApiError('Lịch trình không tồn tại trên máy chủ (HTTP 404).', 404);
    },
  };

  mockConfirmChoice = 'confirm';
  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_f01', email: 'f01@test.vn', display_name: 'F01' },
  };

  const result = await orchestrateDeleteItinerary({
    id: 'itin-404-check',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  // Result phải là true vì xóa thành công trên client
  assert.equal(result, true);
  // Không được rollback lại vào repository
  const items = repo.getSnapshot().itineraries;
  assert.equal(items.length, 0, 'Must NOT rollback on 404; item is cleanly deleted locally');
  // Thông báo chính xác cho người dùng
  assert.ok(
    notifications.some(
      (m) =>
        m.includes('không còn tồn tại trên máy chủ') || m.includes('Đã hoàn tất xóa trên thiết bị'),
    ),
    'Must notify that item was already deleted on server and deleted locally',
  );
});

// ---------------------------------------------------------------------------
// 19. F-02: CREATE in-flight navigation & blocking edit when pending
// ---------------------------------------------------------------------------
test('19. F-02: CREATE in-flight does not navigate to itinerarySaved until POST completes; startEdit blocks pending', async () => {
  const repo = createItineraryRepository([]);
  const nav = createMockNavigation();
  const notifications = [];

  let resolvePost;
  const mockApi = {
    createItinerary: () =>
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
  };

  repo.actions.setDraft({
    id: 'draft-f02',
    title: 'Lịch trình kiểm tra in-flight',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: false,
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_f02', email: 'f02@test.vn', display_name: 'F02' },
  };

  const createPromise = orchestrateCreateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  // Trong lúc POST đang in-flight:
  // 1. Chưa được điều hướng sang itinerarySaved
  assert.equal(
    nav.navigated.some((n) => n.screen === 'itinerarySaved'),
    false,
    'Must not navigate to itinerarySaved while POST is in flight',
  );

  // 2. Trạng thái trong repository là 'pending'
  const pendingItem = repo.getSnapshot().itineraries[0];
  assert.ok(pendingItem);
  assert.equal(pendingItem.syncStatus, 'pending');

  // 3. startEdit phải bị chặn đối với item có syncStatus='pending'
  const editAllowed = repo.actions.startEdit(pendingItem.id);
  assert.equal(editAllowed, false, 'startEdit must return false when syncStatus is pending');
  assert.equal(repo.getSnapshot().editingId, null, 'editingId must remain null');

  // Cho API POST hoàn tất
  resolvePost({
    id: 8888,
    title: 'Lịch trình kiểm tra in-flight',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
    version: 1,
  });

  const saved = await createPromise;
  assert.ok(saved);
  assert.equal(
    nav.navigated.some((n) => n.screen === 'itinerarySaved'),
    true,
    'Must navigate to itinerarySaved once POST succeeds',
  );
  assert.equal(repo.getSnapshot().itineraries[0].syncStatus, 'synced');
  assert.equal(repo.getSnapshot().itineraries[0].remoteId, 8888);
});

// ---------------------------------------------------------------------------
// 20. F-03: defaultConfirm with Android dismiss / cancelable
// ---------------------------------------------------------------------------
test('20. F-03: defaultConfirm Android dismiss triggers onCancel and settles once', async () => {
  alertCalls.length = 0;
  mockConfirmChoice = 'dismiss';

  let confirmCount = 0;
  let cancelCount = 0;

  defaultConfirm(
    'Xác nhận xóa',
    'Bạn có chắc chắn?',
    () => {
      confirmCount++;
    },
    () => {
      cancelCount++;
    },
  );

  assert.equal(alertCalls.length, 1);
  const lastAlert = alertCalls[0];
  assert.ok(lastAlert.options, 'Must pass options to Alert.alert');
  assert.equal(lastAlert.options.cancelable, true, 'Options must be cancelable');
  assert.equal(typeof lastAlert.options.onDismiss, 'function', 'Must provide onDismiss handler');

  assert.equal(cancelCount, 1, 'onCancel must be called once on dismiss');
  assert.equal(confirmCount, 0, 'onConfirm must NOT be called on dismiss');

  // Test settle-once: calling onDismiss again must not increment cancelCount
  lastAlert.options.onDismiss();
  assert.equal(cancelCount, 1, 'Must settle only once');

  // Test orchestrateDeleteItinerary does not hang on dismiss
  const remoteItin = {
    id: 'itin-dismiss-check',
    remoteId: 7777,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình test dismiss',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([remoteItin]);
  const nav = createMockNavigation();

  const deleteResult = await orchestrateDeleteItinerary({
    id: 'itin-dismiss-check',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: { signedIn: true, token: 'token-xyz', user: { uid: 'usr_f03' } },
    navigation: nav,
  });

  assert.equal(deleteResult, false, 'Delete must resolve false on alert dismiss');
  assert.equal(repo.getSnapshot().itineraries.length, 1, 'Item must NOT be deleted');
});

// ---------------------------------------------------------------------------
// 21. F-04: Stale same-account PATCH response on dirty local edit
// ---------------------------------------------------------------------------
test('21. F-04: Stale same-account PATCH response updates base version but preserves syncStatus="local"', async () => {
  const initialItin = {
    id: 'itin-stale-patch',
    remoteId: 5050,
    version: 1,
    syncStatus: 'synced',
    title: 'Bản gốc V1',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const repo = createItineraryRepository([initialItin]);
  const nav = createMockNavigation();
  const notifications = [];

  let resolvePatch;
  const mockApi = {
    updateItinerary: async () =>
      new Promise((resolve) => {
        resolvePatch = resolve;
      }),
  };

  // User sửa sang V2 và bấm lưu
  repo.actions.startEdit('itin-stale-patch');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Bản chỉnh sửa V2 đang đồng bộ',
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_f04', email: 'f04@test.vn', display_name: 'F04' },
  };

  const updatePromise = orchestrateUpdateItinerary({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    notify: (msg) => notifications.push(msg),
    apiService: mockApi,
  });

  // Trong khi PATCH V2 đang in-flight trên máy chủ, user tiếp tục sửa tiếp sang V3 cục bộ!
  repo.actions.startEdit('itin-stale-patch');
  repo.actions.setDraft({
    ...repo.getSnapshot().draft,
    title: 'Bản chỉnh sửa V3 MỚI NHẤT cục bộ',
  });
  repo.actions.saveEdit();

  // Máy chủ trả về xác nhận cho lượt PATCH V2 với version mới là 2
  resolvePatch({
    id: 5050,
    title: 'Bản chỉnh sửa V2 đang đồng bộ',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
    version: 2,
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:30:00Z',
  });

  await updatePromise;

  const currentItem = repo.getSnapshot().itineraries.find((i) => i.id === 'itin-stale-patch');
  assert.ok(currentItem);
  // 1. Bản ghi phải giữ đúng nội dung V3 mới nhất
  assert.equal(currentItem.title, 'Bản chỉnh sửa V3 MỚI NHẤT cục bộ');
  // 2. Base version được cập nhật lên 2 từ server
  assert.equal(currentItem.version, 2);
  // 3. syncStatus TUYỆT ĐỐI KHÔNG được là 'synced', phải là 'local' vì có thay đổi chưa đồng bộ
  assert.equal(
    currentItem.syncStatus,
    'local',
    'Must remain syncStatus="local" when content changed while PATCH was in-flight',
  );
  assert.ok(
    notifications.some((m) => m.includes('Các thay đổi mới nhất của bạn vẫn đang được lưu')),
  );
});

// ---------------------------------------------------------------------------
// 22. F-05: Double-submit synchronous guard in useItineraryViewModel
// ---------------------------------------------------------------------------
test('22. F-05: Synchronous in-flight ref guard prevents rapid double-submission in same frame', async () => {
  let apiCallCount = 0;
  let delayedResolve;

  const mockApi = {
    createItinerary: async () => {
      apiCallCount++;
      return new Promise((resolve) => {
        delayedResolve = resolve;
      });
    },
  };

  const isSavingRef = { current: false };
  let isSavingState = false;

  const mockSubmit = async (params) => {
    if (isSavingRef.current || isSavingState) return;
    isSavingRef.current = true;
    isSavingState = true;
    try {
      await orchestrateCreateItinerary(params);
    } finally {
      isSavingRef.current = false;
      isSavingState = false;
    }
  };

  const repo = createItineraryRepository([]);
  repo.actions.setDraft({
    id: 'draft-f05',
    title: 'Double submit guard test',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: false,
  });

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_f05', email: 'f05@test.vn', display_name: 'F05' },
  };

  const nav = createMockNavigation();

  // Gọi mockSubmit 2 lần đồng thời trong cùng một frame/tick
  const call1 = mockSubmit({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    apiService: mockApi,
  });

  const call2 = mockSubmit({
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    apiService: mockApi,
  });

  // Call 2 phải bị chặn ngay lập tức bởi synchronous ref guard
  assert.equal(apiCallCount, 1, 'API must only be invoked once despite rapid double-submission');

  delayedResolve({
    id: 9991,
    title: 'Double submit guard test',
    date: '2026-11-20',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ place_id: 'cham', start: '08:00', end: '09:00', day: 1 }],
    version: 1,
  });

  await Promise.all([call1, call2]);
  assert.equal(apiCallCount, 1, 'API call count remains 1 after all calls resolve');
  assert.equal(isSavingRef.current, false, 'isSavingRef resets to false');
});

// ---------------------------------------------------------------------------
// 23. F-06: Exact delete rollback restores original index
// ---------------------------------------------------------------------------
test('23. F-06: Delete rollback on middle item restores exact original index and array order', async () => {
  const itemA = {
    id: 'itin-a',
    remoteId: 101,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình A',
    date: '20/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const itemB = {
    id: 'itin-b',
    remoteId: 102,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình B (ở giữa)',
    date: '21/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };
  const itemC = {
    id: 'itin-c',
    remoteId: 103,
    version: 1,
    syncStatus: 'synced',
    title: 'Lịch trình C',
    date: '22/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', start: '08:00', end: '09:00', dayIndex: 1 }],
    saved: true,
  };

  const repo = createItineraryRepository([itemA, itemB, itemC]);
  assert.deepEqual(
    repo.getSnapshot().itineraries.map((i) => i.id),
    ['itin-a', 'itin-b', 'itin-c'],
  );

  const nav = createMockNavigation();
  mockConfirmChoice = 'confirm';

  // API xóa gặp lỗi 500
  const mockApi = {
    deleteItinerary: async () => {
      throw new ItineraryApiError('Server error', 500);
    },
  };

  const authUser = {
    signedIn: true,
    token: 'token-xyz',
    user: { uid: 'usr_f06', email: 'f06@test.vn', display_name: 'F06' },
  };

  // Xóa Item B (index 1)
  const deleteResult = await orchestrateDeleteItinerary({
    id: 'itin-b',
    model: {
      itineraries: repo.getSnapshot().itineraries,
      draft: repo.getSnapshot().draft,
      editingId: repo.getSnapshot().editingId,
      ...repo.actions,
    },
    auth: authUser,
    navigation: nav,
    apiService: mockApi,
  });

  assert.equal(deleteResult, false);

  // Kiểm tra thứ tự sau khi rollback:
  // Item B phải được phục hồi về đúng vị trí index 1, giữ nguyên mảng [A, B, C]
  const finalIds = repo.getSnapshot().itineraries.map((i) => i.id);
  assert.deepEqual(
    finalIds,
    ['itin-a', 'itin-b', 'itin-c'],
    'Restored item must be placed at exact original index, preserving array order',
  );

  const restoredB = repo.getSnapshot().itineraries[1];
  assert.equal(restoredB.id, 'itin-b');
  assert.equal(restoredB.syncStatus, 'error');
  assert.equal(restoredB.remoteId, 102);
});
