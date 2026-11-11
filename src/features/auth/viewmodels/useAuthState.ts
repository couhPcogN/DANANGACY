import { useState } from 'react';
import type { Route, TabName } from '../../../navigation/types';

export function useAuthState(tab: (name: TabName) => void, reset: (route: Route) => void) {
  const [signedIn, setSignedIn] = useState(false);
  const login = () => { setSignedIn(true); tab('home'); };
  const logout = () => { setSignedIn(false); reset({ name: 'welcome' }); };
  return { signedIn, setSignedIn, login, logout };
}
