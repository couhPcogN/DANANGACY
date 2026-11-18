import { createModelContext } from '../../shared/state/createModelContext';
import { createNavigation } from './createNavigation';

const context = createModelContext('Navigation', createNavigation);
export const NavigationProvider = context.Provider;

export function useNavigationViewModel() {
  const { stack, ...actions } = context.useModel();
  return { route: stack[stack.length - 1], ...actions };
}
