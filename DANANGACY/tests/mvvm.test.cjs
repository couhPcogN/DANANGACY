const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();
let stored = null;
const storage = {
  async getItem(key) {
    assert.equal(key, 'danangacy.demo.v1');
    return stored;
  },
  async setItem(key, value) {
    assert.equal(key, 'danangacy.demo.v1');
    stored = value;
  },
};

// Exercise the actual TypeScript repositories without a React Native runtime.
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (id) => {
    if (id === '@react-native-async-storage/async-storage') return storage;
    if (/\.(jpg|png)$/.test(id)) return path.basename(id);
    if (!id.startsWith('.')) return require(id);
    const base = path.resolve(path.dirname(file), id);
    const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(fs.existsSync);
    assert.ok(resolved, `Cannot resolve ${id} from ${file}`);
    return load(resolved);
  };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}

const { createItineraryRepository } = load(
  'src/features/itinerary/repositories/itineraryRepository.ts',
);
const { createGameStateRepository } = load('src/features/game/repositories/gameStateRepository.ts');

test('observable store has stable snapshots and can unsubscribe', () => {
  const { createStore } = load('src/lib/state/createStore.ts');
  const store = createStore({ value: 1 });
  const first = store.getSnapshot();
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);
  store.update((state) => state);
  assert.equal(store.getSnapshot(), first);
  assert.equal(calls, 0);
  store.update(() => ({ value: 2 }));
  assert.equal(calls, 1);
  unsubscribe();
  store.update(() => ({ value: 3 }));
  assert.equal(calls, 1);
});

test('draft edits do not change saved itineraries until save', () => {
  const repository = createItineraryRepository();
  const original = structuredClone(repository.getSnapshot().itineraries[0]);
  assert.equal(repository.actions.startEdit(original.id), true);
  const draft = repository.getSnapshot().draft;
  repository.actions.setDraft({
    ...draft,
    title: 'Changed',
    stops: draft.stops.map((stop, index) => (index === 0 ? { ...stop, start: '08:00' } : stop)),
  });
  assert.deepEqual(repository.getSnapshot().itineraries[0], original);
  assert.equal(repository.actions.saveEdit(), original.id);
  assert.equal(repository.getSnapshot().itineraries[0].title, 'Changed');
  assert.equal(repository.getSnapshot().itineraries[0].stops[0].start, '08:00');
  assert.equal(repository.actions.startEdit('missing'), false);
});

test('new drafts are isolated and saved records keep their assigned ID', () => {
  const repository = createItineraryRepository([]);
  assert.equal(repository.actions.saveEdit(), null);
  repository.actions.startCreate();
  repository.actions.setDraft({ ...repository.getSnapshot().draft, title: 'New itinerary' });
  const saved = repository.actions.saveDraft();
  assert.match(saved.id, /^itinerary-/);
  assert.equal(saved.saved, true);
  assert.equal(repository.getSnapshot().itineraries[0].id, saved.id);
  repository.actions.startCreate();
  assert.notEqual(repository.getSnapshot().draft.title, 'New itinerary');
  assert.equal(repository.getSnapshot().itineraries[0].title, 'New itinerary');
});

test('weather replacement preserves time slots and other stops', () => {
  const repository = createItineraryRepository([]);
  const saved = repository.actions.saveDraft();
  const before = structuredClone(saved.stops);
  assert.equal(repository.actions.replaceSonTra(saved.id), saved.id);
  const after = repository.getSnapshot().itineraries[0].stops;
  assert.deepEqual(
    after,
    before.map((stop) => (stop.placeId === 'son-tra' ? { ...stop, placeId: 'bao-tang-dn' } : stop)),
  );
});

test('quiz resumes progress, awards once and prevents duplicate reward redemption', () => {
  const repository = createGameStateRepository();
  repository.actions.startQuiz();
  assert.equal(repository.getSnapshot().quizIndex, 1);
  while (true) {
    repository.actions.selectAnswer(1);
    repository.actions.confirmAnswer();
    repository.actions.selectAnswer(2);
    assert.equal(repository.getSnapshot().quizSelected, 1);
    if (repository.actions.nextQuestion()) break;
  }
  assert.equal(repository.getSnapshot().points, 170);
  repository.actions.nextQuestion();
  assert.equal(repository.getSnapshot().points, 170);
  assert.equal(repository.actions.redeemReward(), true);
  assert.equal(repository.actions.redeemReward(), false);
  assert.equal(repository.getSnapshot().points, 70);
});

test('feature repositories own independent state and restore saved progress', () => {
  const { createAuthRepository } = load('src/features/auth/repositories/authRepository.ts');
  const { createProfileRepository } = load(
    'src/features/profile/repositories/profileRepository.ts',
  );
  const { createFavoritesRepository } = load(
    'src/features/explore/repositories/favoritesRepository.ts',
  );
  const auth = createAuthRepository(true);
  const profile = createProfileRepository({ name: 'Saved profile', phone: '0123' });
  const favorites = createFavoritesRepository([]);
  auth.actions.logout();
  favorites.actions.toggleFavorite('cham');
  assert.equal(auth.getSnapshot().signedIn, false);
  assert.equal(profile.getSnapshot().name, 'Saved profile');
  assert.deepEqual(favorites.getSnapshot().favorites, ['cham']);
  favorites.actions.toggleFavorite('cham');
  assert.deepEqual(favorites.getSnapshot().favorites, []);
  assert.notEqual(createProfileRepository().getSnapshot().name, 'Saved profile');
  const restored = createGameStateRepository({
    quizCompleted: true,
    points: 70,
    rewardRedeemed: true,
    quizAnswers: [0, 1, 1, 1, 2],
  });
  restored.actions.startQuiz();
  assert.equal(restored.getSnapshot().quizIndex, 0);
  assert.equal(restored.actions.redeemReward(), false);
  assert.equal(restored.getSnapshot().points, 70);
});

test('local persistence migrates legacy itineraries without losing other feature data', async () => {
  const { appStateRepository } = load('src/lib/storage/appStateRepository.ts');
  const itinerary = createItineraryRepository().getSnapshot().itineraries[0];
  stored = JSON.stringify({
    signedIn: true,
    name: 'Saved profile',
    points: 170,
    favorites: [],
    trips: [itinerary],
  });
  const snapshot = await appStateRepository.load();
  assert.equal(snapshot.name, 'Saved profile');
  assert.equal(snapshot.points, 170);
  assert.deepEqual(snapshot.itineraries, [itinerary]);
  assert.ok(!('trips' in snapshot));
  await appStateRepository.save(snapshot);
  assert.deepEqual(JSON.parse(stored).itineraries, [itinerary]);
  const restored = createItineraryRepository((await appStateRepository.load()).itineraries);
  assert.equal(restored.getSnapshot().itineraries[0].id, itinerary.id);
  stored = JSON.stringify({ itineraries: [], trips: [itinerary] });
  assert.deepEqual((await appStateRepository.load()).itineraries, []);
});

test('Views and repositories preserve MVVM dependency boundaries', () => {
  const visit = (directory) =>
    fs
      .readdirSync(directory, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? visit(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      );
  for (const file of visit(path.join(root, 'src')).filter((file) => /\.tsx?$/.test(file))) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const modules = source.statements
      .filter(ts.isImportDeclaration)
      .map((node) => node.moduleSpecifier.text);
    if (/[\\/](screens|components)[\\/]/.test(file)) {
      assert.ok(
        !modules.some((name) => /\/(repositories|providers|data|models)\//.test(name)),
        `View reads model directly: ${file}`,
      );
    }
    if (/[\\/]repositories[\\/]/.test(file)) {
      assert.ok(
        !modules.some((name) => /navigation|viewmodels|providers|^react$/.test(name)),
        `Repository depends on presentation: ${file}`,
      );
    }
  }
});
