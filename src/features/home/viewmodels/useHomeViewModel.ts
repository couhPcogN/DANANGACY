import { useApp } from '../../../providers/AppProvider';

export function useHomeViewModel() {
  const app = useApp();
  const { navigate, trips, name, startCreate } = app;
  return { app, navigate, trips, name, startCreate };
}
