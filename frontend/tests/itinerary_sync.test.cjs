const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

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
  const fn = new Function('require', 'module', 'exports', code);
  fn(
    (id) => {
      if (id.startsWith('.')) {
        const base = path.resolve(path.dirname(file), id);
        const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(
          fs.existsSync,
        );
        if (resolved) return loadTs(resolved);
      }
      return require(id);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const {
  vietnamDateToIso,
  isoDateToVietnam,
  normalizePace,
  mapLocalStopToBackend,
  mapBackendStopToLocal,
  mapItineraryToBackendCreate,
  mapItineraryToBackendUpdate,
  mapBackendToLocalItinerary,
} = loadTs('src/services/api/itineraryMapping.ts');

const { itineraryApiService, ItineraryApiError } = loadTs('src/services/api/itineraryService.ts');

// ---------------------------------------------------------------------------
// 1. Two-way date mapping & timezone neutrality
// ---------------------------------------------------------------------------
test('Two-way date mapping accurately converts DD/MM/YYYY to YYYY-MM-DD and back', () => {
  assert.equal(vietnamDateToIso('15/11/2026'), '2026-11-15');
  assert.equal(isoDateToVietnam('2026-11-15'), '15/11/2026');

  assert.equal(vietnamDateToIso('01/01/2025'), '2025-01-01');
  assert.equal(isoDateToVietnam('2025-01-01'), '01/01/2025');

  assert.equal(vietnamDateToIso('31/12/2026'), '2026-12-31');
  assert.equal(isoDateToVietnam('2026-12-31'), '31/12/2026');
});

// ---------------------------------------------------------------------------
// 2. Invalid date and leap year calendar validation
// ---------------------------------------------------------------------------
test('Date validation correctly handles leap years and rejects impossible calendar dates', () => {
  // 2024 is a leap year -> 29/02/2024 is valid
  assert.equal(vietnamDateToIso('29/02/2024'), '2024-02-29');
  assert.equal(isoDateToVietnam('2024-02-29'), '29/02/2024');

  // 2025 is NOT a leap year -> 29/02/2025 is invalid
  assert.throws(() => vietnamDateToIso('29/02/2025'), /không hợp lệ hoặc không tồn tại/);
  assert.throws(() => isoDateToVietnam('2025-02-29'), /không hợp lệ hoặc không tồn tại/);

  // April has only 30 days -> 31/04/2026 is invalid
  assert.throws(() => vietnamDateToIso('31/04/2026'), /không hợp lệ hoặc không tồn tại/);
  assert.throws(() => isoDateToVietnam('2026-04-31'), /không hợp lệ hoặc không tồn tại/);

  // Month out of range
  assert.throws(() => vietnamDateToIso('15/13/2026'), /không hợp lệ/);
  assert.throws(() => isoDateToVietnam('2026-13-15'), /không hợp lệ/);

  // Empty / malformed strings
  assert.throws(() => vietnamDateToIso(''), /không được để trống/);
  assert.throws(() => isoDateToVietnam(''), /không được để trống/);
  assert.throws(() => vietnamDateToIso('invalid-date'), /không hợp lệ/);
  assert.throws(() => isoDateToVietnam('invalid-date'), /không hợp lệ/);
});

// ---------------------------------------------------------------------------
// 3. Mapping ID and stops list (placeId ⇄ place_id, dayIndex ⇄ day)
// ---------------------------------------------------------------------------
test('Stop mapping and pace normalization preserve field naming conventions', () => {
  const localStop = {
    placeId: 'cham',
    dayIndex: 2,
    start: '09:00',
    end: '10:30',
  };
  const backendStop = mapLocalStopToBackend(localStop);
  assert.deepEqual(backendStop, {
    place_id: 'cham',
    day: 2,
    start: '09:00',
    end: '10:30',
  });

  const convertedBack = mapBackendStopToLocal(backendStop);
  assert.deepEqual(convertedBack, {
    placeId: 'cham',
    dayIndex: 2,
    start: '09:00',
    end: '10:30',
  });

  // Default dayIndex if missing
  assert.equal(mapLocalStopToBackend({ placeId: 'son-tra', start: '14:00', end: '16:00' }).day, 1);
  assert.equal(
    mapBackendStopToLocal({ place_id: 'son-tra', start: '14:00', end: '16:00' }).dayIndex,
    1,
  );

  // Pace normalization
  assert.equal(normalizePace('Thư thả'), 'Thư thả');
  assert.equal(normalizePace('Cân bằng'), 'Cân bằng');
  assert.equal(normalizePace('Năng động'), 'Năng động');
  assert.equal(normalizePace('Gấp gáp'), 'Thư thả');
  assert.equal(normalizePace(undefined), 'Thư thả');
});

// ---------------------------------------------------------------------------
// 4. Response Backend preserves actual remoteId and version
// ---------------------------------------------------------------------------
test('Backend response mapping accurately stores remoteId, version and sets syncStatus to synced', () => {
  const backendRead = {
    id: 105,
    title: 'Khám phá Ngũ Hành Sơn',
    date: '2026-11-20',
    duration: 1,
    pace: 'Cân bằng',
    stops: [
      { place_id: 'ngu-hanh-son', day: 1, start: '08:00', end: '10:00' },
      { place_id: 'cham', day: 1, start: '14:00', end: '15:30' },
    ],
    version: 4,
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:30:00Z',
  };

  const local = mapBackendToLocalItinerary(backendRead, 'local-itin-existing-1');
  assert.equal(local.id, 'local-itin-existing-1');
  assert.equal(local.remoteId, 105);
  assert.equal(local.version, 4);
  assert.equal(local.syncStatus, 'synced');
  assert.equal(local.title, 'Khám phá Ngũ Hành Sơn');
  assert.equal(local.date, '20/11/2026');
  assert.equal(local.duration, 1);
  assert.equal(local.pace, 'Cân bằng');
  assert.equal(local.stops.length, 2);
  assert.equal(local.stops[0].placeId, 'ngu-hanh-son');
  assert.equal(local.saved, true);
});

// ---------------------------------------------------------------------------
// 5. Local itinerary without remoteId remains unsynced
// ---------------------------------------------------------------------------
test('Local itinerary created offline maintains undefined remoteId and version', () => {
  const localItinerary = {
    id: 'itinerary-1700000000000',
    title: 'Bản nháp cục bộ',
    date: '15/11/2026',
    duration: 1,
    pace: 'Thư thả',
    stops: [{ placeId: 'cham', dayIndex: 1, start: '09:00', end: '10:00' }],
    saved: true,
  };

  assert.equal(localItinerary.remoteId, undefined);
  assert.equal(localItinerary.version, undefined);
  assert.equal(localItinerary.syncStatus, undefined);

  const payload = mapItineraryToBackendCreate(localItinerary);
  assert.equal(payload.title, 'Bản nháp cục bộ');
  assert.equal(payload.date, '2026-11-15');
  assert.equal('id' in payload, false);
  assert.equal('remoteId' in payload, false);
  assert.equal('version' in payload, false);
});

// ---------------------------------------------------------------------------
// 6. PATCH always sends version in request body JSON (not header)
// ---------------------------------------------------------------------------
test('itineraryApiService.updateItinerary sends version in JSON body and does NOT use If-Match header', async () => {
  const originalFetch = global.fetch;
  let capturedUrl = '';
  let capturedOptions = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 77,
        title: 'Lịch trình đã sửa',
        date: '2026-11-15',
        stops: [{ place_id: 'cham', day: 1, start: '09:00', end: '10:00' }],
        version: 3,
        created_at: '2026-11-15T00:00:00Z',
        updated_at: '2026-11-15T01:00:00Z',
      }),
    };
  };

  try {
    const res = await itineraryApiService.updateItinerary(
      77,
      {
        title: 'Lịch trình đã sửa',
        version: 2,
      },
      'valid-jwt-token',
    );

    assert.ok(capturedUrl.includes('/api/v1/itineraries/77'));
    assert.equal(capturedOptions.method, 'PATCH');
    assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer valid-jwt-token');
    assert.equal(capturedOptions.headers['If-Match'], undefined);

    const body = JSON.parse(capturedOptions.body);
    assert.equal(body.title, 'Lịch trình đã sửa');
    assert.equal(body.version, 2);
    assert.equal(res.version, 3);
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 7. PATCH missing/invalid version is rejected on client-side before network call
// ---------------------------------------------------------------------------
test('itineraryApiService.updateItinerary rejects missing or invalid version client-side before network request', async () => {
  const originalFetch = global.fetch;
  let fetchCallCount = 0;
  global.fetch = async () => {
    fetchCallCount++;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    // Missing version (undefined)
    await assert.rejects(
      () => itineraryApiService.updateItinerary(77, { title: 'No version' }, 'jwt-token'),
      /Bắt buộc phải có phiên bản hợp lệ \(version >= 1\)/,
    );
    assert.equal(fetchCallCount, 0);

    // Invalid version (0 or negative)
    await assert.rejects(
      () =>
        itineraryApiService.updateItinerary(77, { title: 'Zero version', version: 0 }, 'jwt-token'),
      /Bắt buộc phải có phiên bản hợp lệ \(version >= 1\)/,
    );
    assert.equal(fetchCallCount, 0);

    // Non-integer version
    await assert.rejects(
      () =>
        itineraryApiService.updateItinerary(
          77,
          { title: 'Float version', version: 1.5 },
          'jwt-token',
        ),
      /Bắt buộc phải có phiên bản hợp lệ \(version >= 1\)/,
    );
    assert.equal(fetchCallCount, 0);

    // mapItineraryToBackendUpdate also validates version
    assert.throws(
      () =>
        mapItineraryToBackendUpdate(
          {
            title: 'Test',
            date: '15/11/2026',
            stops: [{ placeId: 'cham', start: '09:00', end: '10:00' }],
          },
          0,
        ),
      /Phiên bản \(version\) phải là số nguyên dương hợp lệ/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 8. HTTP 401, 404, 409, 422 error handling
// ---------------------------------------------------------------------------
test('itineraryApiService handles HTTP 401, 404, 409, 422 with typed ItineraryApiError and NO auto-retry', async () => {
  const originalFetch = global.fetch;

  // 401 Unauthorized
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Yêu cầu đăng nhập để thực hiện thao tác này.' }),
  });
  await assert.rejects(
    () =>
      itineraryApiService.createItinerary(
        { title: 'T', date: '2026-11-15', stops: [] },
        'invalid-token',
      ),
    (err) => err instanceof ItineraryApiError && err.status === 401,
  );

  // 404 Not Found
  global.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ detail: 'Không tìm thấy lịch trình.' }),
  });
  await assert.rejects(
    () => itineraryApiService.updateItinerary(999, { title: 'T', version: 1 }, 'valid-token'),
    (err) => err instanceof ItineraryApiError && err.status === 404,
  );

  // 409 Conflict (Optimistic lock conflict)
  let retryCount = 0;
  global.fetch = async () => {
    retryCount++;
    return {
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Lịch trình đã thay đổi. Hãy tải lại trước khi sửa.' }),
    };
  };
  await assert.rejects(
    () => itineraryApiService.updateItinerary(77, { title: 'T', version: 1 }, 'valid-token'),
    (err) => err instanceof ItineraryApiError && err.status === 409,
  );
  // Verify NO auto-retry after 409 Conflict
  assert.equal(retryCount, 1);

  // 422 Unprocessable Entity
  global.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({ detail: 'Giờ bắt đầu phải sớm hơn giờ kết thúc.' }),
  });
  await assert.rejects(
    () =>
      itineraryApiService.createItinerary(
        { title: 'T', date: '2026-11-15', stops: [] },
        'valid-token',
      ),
    (err) => err instanceof ItineraryApiError && err.status === 422,
  );

  global.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// 9. HTTP 204 No Content handling (no res.json() call)
// ---------------------------------------------------------------------------
test('itineraryApiService.deleteItinerary correctly handles HTTP 204 without attempting res.json()', async () => {
  const originalFetch = global.fetch;
  let jsonCalled = false;

  global.fetch = async () => ({
    ok: true,
    status: 204,
    json: async () => {
      jsonCalled = true;
      throw new Error('JSON parsing should never be called on 204 No Content');
    },
  });

  try {
    const success = await itineraryApiService.deleteItinerary(88, 'valid-token');
    assert.equal(success, true);
    assert.equal(jsonCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 10. Network timeout and fetch failure handling
// ---------------------------------------------------------------------------
test('itineraryApiService wraps network failures into ItineraryApiError with status 0', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => {
    throw new TypeError('Failed to fetch (Network disconnected)');
  };

  try {
    await assert.rejects(
      () => itineraryApiService.fetchItineraries('token'),
      (err) => err instanceof ItineraryApiError && err.status === 0,
    );

    await assert.rejects(
      () =>
        itineraryApiService.createItinerary({ title: 'T', date: '2026-11-15', stops: [] }, 'token'),
      (err) => err instanceof ItineraryApiError && err.status === 0,
    );

    await assert.rejects(
      () => itineraryApiService.updateItinerary(1, { version: 1 }, 'token'),
      (err) => err instanceof ItineraryApiError && err.status === 0,
    );

    await assert.rejects(
      () => itineraryApiService.deleteItinerary(1, 'token'),
      (err) => err instanceof ItineraryApiError && err.status === 0,
    );
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 11. Guest mutation requests are rejected client-side when token is absent/empty
// ---------------------------------------------------------------------------
test('Guest mutating requests (POST, PATCH, DELETE) are rejected client-side when token is absent', async () => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls++;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    // POST without token
    await assert.rejects(
      () => itineraryApiService.createItinerary({ title: 'T', date: '2026-11-15', stops: [] }),
      /Yêu cầu token xác thực để tạo lịch trình trên máy chủ/,
    );
    assert.equal(fetchCalls, 0);

    // PATCH with empty token
    await assert.rejects(
      () => itineraryApiService.updateItinerary(1, { version: 1 }, '   '),
      /Yêu cầu token xác thực để cập nhật lịch trình trên máy chủ/,
    );
    assert.equal(fetchCalls, 0);

    // DELETE without token
    await assert.rejects(
      () => itineraryApiService.deleteItinerary(1, undefined),
      /Yêu cầu token xác thực để xóa lịch trình trên máy chủ/,
    );
    assert.equal(fetchCalls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 12. Does not invent fake IDs or fake versions
// ---------------------------------------------------------------------------
test('Mapping functions never infer or invent fake IDs or fake versions from malformed responses', () => {
  // Missing or non-numeric backend ID
  assert.throws(
    () =>
      mapBackendToLocalItinerary({
        id: 'fake-id',
        version: 1,
        title: 'T',
        date: '2026-11-15',
        stops: [],
      }),
    /id "fake-id" không phải số nguyên dương/,
  );

  // Missing or non-numeric backend version
  assert.throws(
    () =>
      mapBackendToLocalItinerary({
        id: 10,
        version: 'fake-v',
        title: 'T',
        date: '2026-11-15',
        stops: [],
      }),
    /version "fake-v" không phải số nguyên dương/,
  );

  // Negative backend ID
  assert.throws(
    () =>
      mapBackendToLocalItinerary({ id: -5, version: 1, title: 'T', date: '2026-11-15', stops: [] }),
    /id "-5" không phải số nguyên dương/,
  );

  // Negative backend version
  assert.throws(
    () =>
      mapBackendToLocalItinerary({ id: 10, version: 0, title: 'T', date: '2026-11-15', stops: [] }),
    /version "0" không phải số nguyên dương/,
  );
});
