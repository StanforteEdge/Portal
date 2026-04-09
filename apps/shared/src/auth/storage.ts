import type { AuthSession } from "./types";

export type SessionStorageAdapter = {
  getStoredSession: () => AuthSession;
  persistSession: (accessToken: string, refreshToken: string, expiresInSeconds?: number) => void;
  updateSessionTokens: (accessToken: string, refreshToken?: string, expiresInSeconds?: number) => void;
  clearSession: () => void;
};

export function createSessionStorage(prefix = "se"): SessionStorageAdapter {
  const ACCESS_TOKEN_KEY = `${prefix}_access_token`;
  const REFRESH_TOKEN_KEY = `${prefix}_refresh_token`;
  const EXPIRES_AT_KEY = `${prefix}_token_expires_at`;

  function safeLocalStorage() {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  }

  function getStoredSession(): AuthSession {
    const store = safeLocalStorage();
    if (!store) {
      return { accessToken: null, refreshToken: null, expiresAt: null };
    }

    const accessToken = store.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = store.getItem(REFRESH_TOKEN_KEY);
    const rawExpiresAt = store.getItem(EXPIRES_AT_KEY);
    const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;

    return {
      accessToken,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt ?? NaN) ? expiresAt : null,
    };
  }

  function persistSession(accessToken: string, refreshToken: string, expiresInSeconds?: number) {
    const store = safeLocalStorage();
    if (!store) return;

    store.setItem(ACCESS_TOKEN_KEY, accessToken);
    store.setItem(REFRESH_TOKEN_KEY, refreshToken);

    if (typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)) {
      store.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      store.removeItem(EXPIRES_AT_KEY);
    }
  }

  function updateSessionTokens(accessToken: string, refreshToken?: string, expiresInSeconds?: number) {
    const store = safeLocalStorage();
    if (!store) return;

    store.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      store.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)) {
      store.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    }
  }

  function clearSession() {
    const store = safeLocalStorage();
    if (!store) return;

    store.removeItem(ACCESS_TOKEN_KEY);
    store.removeItem(REFRESH_TOKEN_KEY);
    store.removeItem(EXPIRES_AT_KEY);
  }

  return {
    getStoredSession,
    persistSession,
    updateSessionTokens,
    clearSession,
  };
}
