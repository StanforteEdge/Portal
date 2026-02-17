const ACCESS_TOKEN_KEY = "se_access_token";
const REFRESH_TOKEN_KEY = "se_refresh_token";
const EXPIRES_AT_KEY = "se_token_expires_at";

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export function getStoredSession(): StoredSession {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAtRaw = localStorage.getItem(EXPIRES_AT_KEY);

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : null,
  };
}

export function persistSession(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds?: number
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  if (expiresInSeconds) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  } else {
    localStorage.removeItem(EXPIRES_AT_KEY);
  }
}

export function updateSessionTokens(
  accessToken: string,
  refreshToken?: string,
  expiresInSeconds?: number
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (expiresInSeconds) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}
