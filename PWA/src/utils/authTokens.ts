export type NormalizedTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

function parseExpiresIn(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const raw = value.trim().toLowerCase();
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  if (unit === "d") return amount * 60 * 60 * 24;
  return undefined;
}

export function normalizeTokens(payload: any): NormalizedTokens {
  const accessToken =
    payload?.access_token ?? payload?.accessToken ?? payload?.tokens?.access_token ?? payload?.tokens?.accessToken;
  const refreshToken =
    payload?.refresh_token ??
    payload?.refreshToken ??
    payload?.tokens?.refresh_token ??
    payload?.tokens?.refreshToken;
  const expiresRaw =
    payload?.expires_in ?? payload?.expiresIn ?? payload?.tokens?.expires_in ?? payload?.tokens?.expiresIn;

  if (!accessToken || !refreshToken) {
    throw new Error("Invalid auth token response.");
  }

  return {
    access_token: String(accessToken),
    refresh_token: String(refreshToken),
    expires_in: parseExpiresIn(expiresRaw),
  };
}
