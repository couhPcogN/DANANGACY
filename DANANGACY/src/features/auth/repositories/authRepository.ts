import { createStore } from '../../../lib/state/createStore';

export function createAuthRepository(initial?: boolean) {
  const store = createStore({ signedIn: initial === true });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      login: () => store.update(() => ({ signedIn: true })),
      logout: () => store.update(() => ({ signedIn: false })),
    },
  };
}
