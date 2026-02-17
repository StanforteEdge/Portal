import apiClient from "@/utils/httpClient";
import { persistSession, clearSession } from "@/utils/authStorage";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface LoginResponse {
  user: {
    id: number;
    roles: string[];
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
    [key: string]: unknown;
  } | null;
}

export async function login(email: string, password: string) {
  const response = await apiClient.post("/auth/login", { email, password });

  const {
    data: {
      data: { tokens, user },
    },
  }: { data: { data: LoginResponse } } = response;

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
  const {
    data: {
      data: status,
    },
  }: { data: { data: StatusResponse } } = response;

  return status;
}

export async function requestPasswordReset(email: string) {
  return apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(payload: { token: string; new_password: string }) {
  return apiClient.post("/auth/reset-password", payload);
}
