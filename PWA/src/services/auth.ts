import apiClient from "@/utils/httpClient";
import { persistSession, clearSession } from "@/utils/authStorage";
import { normalizeTokens } from "@/utils/authTokens";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface LoginResponse {
  user: {
    id: number;
    roles: string[];
    enabled_modules?: string[];
    [key: string]: unknown;
  };
  tokens: AuthTokens;
  message?: string;
}

export interface StatusResponse {
  authenticated: boolean;
  user: {
    id: number;
    roles: string[];
    permissions?: string[];
    enabled_modules?: string[];
    [key: string]: unknown;
  } | null;
}

export async function login(email: string, password: string) {
  const response = await apiClient.post("/auth/login", { email, password });
  const payload = response?.data?.data ?? {};
  const tokens = normalizeTokens(payload);
  const user = payload?.user;

  persistSession(tokens.access_token, tokens.refresh_token, tokens.expires_in);
  return { tokens, user };
}

export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearSession();
  }
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  return apiClient.post("/auth/change-password", payload);
}

export async function fetchStatus() {
  const response = await apiClient.get("/auth/status");
  const payload = response?.data?.data ?? {};

  if (typeof payload?.authenticated === "boolean") {
    return payload as StatusResponse;
  }

  if (payload?.id && payload?.email) {
    return {
      authenticated: true,
      user: payload,
    } as StatusResponse;
  }

  return { authenticated: false, user: null } as StatusResponse;
}

export async function requestPasswordReset(email: string) {
  return apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(payload: { token: string; new_password: string }) {
  return apiClient.post("/auth/reset-password", payload);
}

export async function acceptInvite(payload: {
  token: string;
  new_password: string;
  confirm_password: string;
}) {
  return apiClient.post("/auth/accept-invite", payload);
}
