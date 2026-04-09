export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export function getStoredSession(): StoredSession {
  return {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };
}

export function persistSession(): void {
  return;
}

export function updateSessionTokens(): void {
  return;
}

export function clearSession(): void {
  return;
}
