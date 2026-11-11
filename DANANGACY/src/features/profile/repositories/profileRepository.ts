import { createStore } from '../../../lib/state/createStore';

export type Profile = { name: string; email: string; phone: string };

export function createProfileRepository(initial?: Partial<Profile>) {
  const store = createStore<Profile>({
    name: typeof initial?.name === 'string' ? initial.name : 'Nguyễn Hân',
    email: typeof initial?.email === 'string' ? initial.email : 'han.nguyen@email.com',
    phone: typeof initial?.phone === 'string' ? initial.phone : '',
  });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      updateProfile: (patch: Partial<Profile>) => store.update((state) => ({ ...state, ...patch })),
    },
  };
}
