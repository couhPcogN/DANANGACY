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

test('createAuthRepository initializes, authenticates, and logs out correctly', () => {
  const { createAuthRepository } = loadTs('src/features/auth/repositories/authRepository.ts');
  const repo = createAuthRepository(false);
  assert.equal(repo.getSnapshot().signedIn, false);
  assert.equal(repo.getSnapshot().token, null);
  assert.equal(repo.getSnapshot().user, null);

  repo.actions.setAuthenticated('mock-token-xyz', {
    id: 1,
    email: 'user@test.vn',
    display_name: 'Test User',
  });
  const authed = repo.getSnapshot();
  assert.equal(authed.signedIn, true);
  assert.equal(authed.token, 'mock-token-xyz');
  assert.equal(authed.user.display_name, 'Test User');

  repo.actions.logout();
  const loggedOut = repo.getSnapshot();
  assert.equal(loggedOut.signedIn, false);
  assert.equal(loggedOut.token, null);
  assert.equal(loggedOut.user, null);
});

test('authService handles login with API response', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.ok(url.includes('/api/auth/login'));
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.email, 'test@danang.vn');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        user: { id: 42, email: 'test@danang.vn', display_name: 'Đà Nẵng' },
      }),
    };
  };

  try {
    const { authService } = loadTs('src/services/api/authService.ts');
    const res = await authService.login('test@danang.vn', 'Pass123456');
    assert.equal(res.access_token, 'fake-jwt-token');
    assert.equal(res.user.display_name, 'Đà Nẵng');
  } finally {
    global.fetch = originalFetch;
  }
});

test('authService throws on 401 login error', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Email hoặc mật khẩu không chính xác.' }),
  });

  try {
    const { authService } = loadTs('src/services/api/authService.ts');
    await assert.rejects(
      () => authService.login('wrong@danang.vn', 'WrongPass123'),
      /Email hoặc mật khẩu không chính xác/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
