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
      if (id === '@react-native-async-storage/async-storage') {
        return {
          getItem: async () => null,
          setItem: async () => {},
        };
      }
      if (/\.(jpg|png)$/.test(id)) return path.basename(id);
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

test('Guest -> Login -> User -> Logout complete flow lifecycle', () => {
  const { createAuthRepository } = loadTs('src/features/auth/repositories/authRepository.ts');
  const { createProfileRepository } = loadTs(
    'src/features/profile/repositories/profileRepository.ts',
  );
  const { createNavigation } = loadTs('src/app/navigation/createNavigation.ts');

  // Step 1: Initial state is Guest
  const nav = createNavigation({ name: 'home' });
  const auth = createAuthRepository(false);
  const profile = createProfileRepository();

  assert.equal(nav.getSnapshot().stack[0].name, 'home');
  assert.equal(auth.getSnapshot().signedIn, false);
  assert.equal(auth.getSnapshot().token, null);
  assert.equal(profile.getSnapshot().name, 'Khách tham quan');
  assert.equal(profile.getSnapshot().email, '');

  // Step 2: Guest clicks Login or Register
  nav.actions.navigate('login');
  assert.equal(nav.getSnapshot().stack.at(-1).name, 'login');
  assert.equal(nav.actions.canGoBack(), true);

  // Step 3: From Login, user can also navigate to Register
  nav.actions.navigate('register');
  assert.equal(nav.getSnapshot().stack.at(-1).name, 'register');

  // Step 4: Back navigation returns cleanly
  nav.actions.back();
  assert.equal(nav.getSnapshot().stack.at(-1).name, 'login');

  // Step 5: User logs in successfully
  const mockToken = 'mock_jwt_access_token_123';
  const mockUser = {
    id: 10,
    email: 'han_danang@danangacy.vn',
    display_name: 'Trần Văn Hân',
  };
  auth.actions.setAuthenticated(mockToken, mockUser);
  profile.actions.updateProfile({
    name: mockUser.display_name,
    email: mockUser.email,
  });
  nav.actions.tab('home');

  // Step 6: Verify User mode
  assert.equal(auth.getSnapshot().signedIn, true);
  assert.equal(auth.getSnapshot().token, mockToken);
  assert.equal(auth.getSnapshot().user.display_name, 'Trần Văn Hân');
  assert.equal(profile.getSnapshot().name, 'Trần Văn Hân');
  assert.equal(profile.getSnapshot().email, 'han_danang@danangacy.vn');
  assert.equal(nav.getSnapshot().stack[0].name, 'home');

  // Step 7: User visits Profile tab
  nav.actions.tab('profile');
  assert.equal(nav.getSnapshot().stack[0].name, 'profile');
  assert.equal(profile.getSnapshot().name, 'Trần Văn Hân');

  // Step 8: User clicks Logout
  auth.actions.logout();
  profile.actions.updateProfile({ name: 'Khách tham quan', email: '', phone: '' });
  nav.actions.reset({ name: 'home' });

  // Step 9: Verify return to Guest mode on Home
  assert.equal(auth.getSnapshot().signedIn, false);
  assert.equal(auth.getSnapshot().token, null);
  assert.equal(auth.getSnapshot().user, null);
  assert.equal(profile.getSnapshot().name, 'Khách tham quan');
  assert.equal(profile.getSnapshot().email, '');
  assert.equal(nav.getSnapshot().stack[0].name, 'home');
});
