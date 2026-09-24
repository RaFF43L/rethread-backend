// Tokens returned by the identity provider after a successful authentication.
export interface AuthTokens {
  accessToken: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: number | undefined;
}
