import type { AuthTokens } from "./types";

export function normalizeTokens(payload: any): AuthTokens {
  const accessToken =
    payload?.access_token ?? payload?.accessToken ?? payload?.tokens?.access_token ?? payload?.tokens?.accessToken;
  const refreshToken =
    payload?.refresh_token ?? payload?.refreshToken ?? payload?.tokens?.refresh_token ?? payload?.tokens?.refreshToken;
  const expiresIn = payload?.expires_in ?? payload?.expiresIn ?? payload?.tokens?.expires_in ?? payload?.tokens?.expiresIn;

  if (!accessToken || !refreshToken) {
    throw new Error("Invalid auth token response.");
  }

  return {
    access_token: String(accessToken),
    refresh_token: String(refreshToken),
    expires_in: typeof expiresIn === "number" ? expiresIn : Number(expiresIn) || undefined,
  };
}
