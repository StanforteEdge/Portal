import type { AuthTokens } from "./types";

export function normalizeTokens(payload: any): AuthTokens {
  const accessToken =
    payload?.access_token ?? payload?.accessToken ?? payload?.tokens?.access_token ?? payload?.tokens?.accessToken;
  const refreshToken =
    payload?.refresh_token ?? payload?.refreshToken ?? payload?.tokens?.refresh_token ?? payload?.tokens?.refreshToken;
  const expiresIn = payload?.expires_in ?? payload?.expiresIn ?? payload?.tokens?.expires_in ?? payload?.tokens?.expiresIn;

  // In cookie-only mode, these might be undefined in the JSON body
  // but they are present in httpOnly cookies.
  return {
    access_token: accessToken ? String(accessToken) : "",
    refresh_token: refreshToken ? String(refreshToken) : "",
    expires_in: typeof expiresIn === "number" ? expiresIn : Number(expiresIn) || undefined,
  };
}
