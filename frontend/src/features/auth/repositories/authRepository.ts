import { createStore } from '../../../shared/state/createStore';
import type { AuthState, AuthUser } from '../types';

export function createAuthRepository(initial?: boolean | Partial<AuthState>) {
  const isInitialBool = typeof initial === 'boolean';
  const store = createStore<AuthState>({
    signedIn: isInitialBool ? initial : initial?.signedIn === true,
    token: isInitialBool ? null : (initial?.token ?? null),
    user: isInitialBool ? null : (initial?.user ?? null),
  });

  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      setAuthenticated: (token: string, user: AuthUser) =>
        store.update(() => ({ signedIn: true, token, user })),
      login: () => store.update((state) => ({ ...state, signedIn: true })),
      logout: () => store.update(() => ({ signedIn: false, token: null, user: null })),
    },
  };
}
