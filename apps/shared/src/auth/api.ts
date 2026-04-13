import { normalizeTokens } from "./tokens";
import type { HttpRequest } from "./http-client";
import type { AuthStatusResponse, AuthTokens, AuthUser } from "./types";

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry: unknown) => String(entry).trim()).filter(Boolean)
    : [];
}

function normalizeUser(payload: any): AuthUser {
  const organizations = Array.isArray(payload?.organizations)
    ? payload.organizations
        .map((entry: any) => ({
          id: String(entry?.id ?? ""),
          name: String(entry?.name ?? ""),
        }))
        .filter((entry: { id: string }) => entry.id)
    : [];

  const organizationIdsFromList = organizations.map((entry: { id: string }) => entry.id);
  const rawOrganizationIds = Array.isArray(payload?.organization_ids)
    ? payload.organization_ids.map((entry: unknown) => String(entry))
    : [];

  return {
    id: String(payload?.id ?? ""),
    email: String(payload?.email ?? ""),
    username: payload?.username ? String(payload.username) : undefined,
    first_name: payload?.first_name ? String(payload.first_name) : undefined,
    last_name: payload?.last_name ? String(payload.last_name) : undefined,
    roles: normalizeStringArray(payload?.roles),
    permissions: normalizeStringArray(payload?.permissions),
    enabled_modules: normalizeStringArray(payload?.enabled_modules),
    onboarding_status: payload?.onboarding_status ? String(payload.onboarding_status) : null,
    organization_id:
      payload?.organization_id !== undefined && payload?.organization_id !== null
        ? String(payload.organization_id)
        : null,
    primary_organization_id:
      payload?.primary_organization_id !== undefined && payload?.primary_organization_id !== null
        ? String(payload.primary_organization_id)
        : null,
    organization_ids: rawOrganizationIds.length ? rawOrganizationIds : organizationIdsFromList,
    organizations,
  };
}

export function createAuthApi(httpRequest: HttpRequest) {
  async function fetchCurrentUser(): Promise<AuthUser | null> {
    try {
      const payload = await httpRequest<any>("/me");
      if (payload) {
        return normalizeUser(payload?.user ?? payload?.profile ?? payload);
      }
    } catch {
      // Try profile endpoint as fallback for environments that expose /profile instead of /me.
    }

    try {
      const payload = await httpRequest<any>("/profile");
      if (payload) {
        return normalizeUser(payload?.user ?? payload?.profile ?? payload);
      }
    } catch {
      return null;
    }

    return null;
  }

  async function login(email: string, password: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const payload = await httpRequest<any>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    const tokens = normalizeTokens(payload);
    const userPayload = payload?.user ?? payload?.profile ?? payload;
    const user = normalizeUser(userPayload);
    return { tokens, user };
  }

  async function logout() {
    try {
      await httpRequest("/auth/logout", {
        method: "POST",
      });
    } catch {
      // no-op
    }
  }

  async function fetchStatus(): Promise<AuthStatusResponse> {
    const payload = await httpRequest<any>("/auth/status");

    if (typeof payload?.authenticated === "boolean") {
      return {
        authenticated: payload.authenticated,
        user: payload.user ? normalizeUser(payload.user) : null,
      };
    }

    // Some backends return user fields directly from /auth/status without an `authenticated` flag.
    if (payload?.id && payload?.email) {
      return {
        authenticated: true,
        user: normalizeUser(payload),
      };
    }

    if (payload?.user) {
      return {
        authenticated: true,
        user: normalizeUser(payload.user),
      };
    }

    return { authenticated: false, user: null };
  }

  function requestPasswordReset(email: string) {
    return httpRequest("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    });
  }

  function resetPassword(token: string, newPassword: string) {
    return httpRequest("/auth/reset-password", {
      method: "POST",
      body: {
        token,
        new_password: newPassword,
      },
      auth: false,
    });
  }

  function acceptInvite(payload: {
    token: string;
    first_name?: string;
    last_name?: string;
    password: string;
  }) {
    return httpRequest("/auth/accept-invite", {
      method: "POST",
      body: payload,
      auth: false,
    });
  }

  return {
    login,
    logout,
    fetchStatus,
    fetchCurrentUser,
    requestPasswordReset,
    resetPassword,
    acceptInvite,
  };
}
