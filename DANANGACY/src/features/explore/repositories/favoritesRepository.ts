import { createStore } from '../../../lib/state/createStore';

export function createFavoritesRepository(initial?: string[]) {
  const store = createStore({
    favorites: Array.isArray(initial)
      ? initial.filter((id) => typeof id === 'string')
      : ['cham', 'son-tra', 'cau-rong'],
  });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      toggleFavorite(id: string) {
        store.update(({ favorites }) => ({
          favorites: favorites.includes(id)
            ? favorites.filter((item) => item !== id)
            : [...favorites, id],
        }));
      },
    },
  };
}
