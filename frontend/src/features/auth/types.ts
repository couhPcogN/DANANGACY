export type AuthUser = {
  id: number;
  email: string;
  display_name: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type AuthState = {
  signedIn: boolean;
  token: string | null;
  user: AuthUser | null;
};
