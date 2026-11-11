import { createContext, useContext, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { Repository } from '../lib/state/createStore';

export function createModelContext<State extends object, Actions extends object, Initial>(
  name: string,
  createRepository: (initial?: Initial) => Repository<State, Actions>,
) {
  const Context = createContext<Repository<State, Actions> | null>(null);
  Context.displayName = `${name}Model`;

  function Provider({ initialState, children }: { initialState?: Initial; children: ReactNode }) {
    const [repository] = useState(() => createRepository(initialState));
    return <Context.Provider value={repository}>{children}</Context.Provider>;
  }

  function useModel(): State & Actions {
    const repository = useContext(Context);
    if (!repository) throw new Error(`${name} model must be used inside its provider`);
    const state = useSyncExternalStore(
      repository.subscribe,
      repository.getSnapshot,
      repository.getSnapshot,
    );
    return { ...state, ...repository.actions };
  }

  return { Provider, useModel };
}
