export type Repository<State, Actions> = {
  getSnapshot: () => State;
  subscribe: (listener: () => void) => () => void;
  actions: Actions;
};

export function createStore<State>(initialState: State) {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(change: (current: State) => State) {
      const next = change(state);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
  };
}
