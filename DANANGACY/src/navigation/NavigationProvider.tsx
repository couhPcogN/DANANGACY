import type { Route, RouteName, TabName } from './types';
import { createStore } from '../lib/state/createStore';
import { createModelContext } from '../providers/createModelContext';

function createNavigation(initial?: Route) {
  const store = createStore({ stack: [initial ?? ({ name: 'welcome' } as Route)] });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      navigate: (name: RouteName, id?: string) =>
        store.update(({ stack }) => ({ stack: [...stack, { name, id }] })),
      back: () =>
        store.update(({ stack }) => ({ stack: stack.length > 1 ? stack.slice(0, -1) : stack })),
      tab: (name: TabName) => store.update(() => ({ stack: [{ name }] })),
      reset: (route: Route) => store.update(() => ({ stack: [route] })),
    },
  };
}

const context = createModelContext('Navigation', createNavigation);
export const NavigationProvider = context.Provider;

export function useNavigationViewModel() {
  const { stack, ...actions } = context.useModel();
  return { route: stack[stack.length - 1], ...actions };
}
