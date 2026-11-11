import { useState } from 'react';
import type { Route, RouteName, TabName } from './types';

export function useNavigationState() {
  const [stack, setStack] = useState<Route[]>([{ name: 'welcome' }]);
  const route = stack[stack.length - 1];
  const navigate = (name: RouteName, id?: string) => setStack((s) => [...s, { name, id }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const tab = (name: TabName) => setStack([{ name }]);
  const reset = (route: Route) => setStack([route]);
  return { route, navigate, back, tab, reset };
}
