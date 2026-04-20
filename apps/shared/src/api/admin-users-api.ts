import type { HttpRequest } from "../auth/http-client";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  type: string;
  status: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
  primary_organization_id?: string | null;
  primary_organization?: { id: string; name: string } | null;
  organizations?: Array<{ id: string; name: string; is_primary?: boolean }>;
};

export type AdminUserRole = {
  id: string;
  slug: string;
  name: string;
  is_primary: boolean;
};

export type AdminUserDetail = AdminUser & {
  roles?: AdminUserRole[];
};

export type AdminUsersResponse = {
  data: AdminUser[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type RoleOption = {
  id: string;
  slug: string;
  name: string;
};

export function createAdminUsersApi(httpRequest: HttpRequest) {
  return {
    listUsers(params?: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      type?: string;
    }): Promise<AdminUsersResponse> {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.type) query.set("type", params.type);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return httpRequest<AdminUsersResponse>(`/admin/users${suffix}`);
    },

    getUser(id: string): Promise<AdminUserDetail> {
      return httpRequest<AdminUserDetail>(`/admin/users/${id}`);
    },

    createUser(payload: {
      email: string;
      first_name?: string;
      last_name?: string;
      type?: string;
      status?: string;
      organization_id?: string;
    }): Promise<AdminUser> {
      return httpRequest<AdminUser>("/admin/users", {
        method: "POST",
        body: payload,
      });
    },

    updateUser(
      id: string,
      payload: {
        email?: string;
        first_name?: string;
        last_name?: string;
        type?: string;
        organization_id?: string;
      },
    ): Promise<AdminUser> {
      return httpRequest<AdminUser>(`/admin/users/${id}`, {
        method: "POST",
        body: payload,
      });
    },

    updateUserStatus(
      id: string,
      payload: { status: string; reason?: string },
    ): Promise<AdminUser> {
      return httpRequest<AdminUser>(`/admin/users/${id}/status`, {
        method: "POST",
        body: payload,
      });
    },

    getUserRoles(id: string): Promise<{
      user: { id: string; email: string };
      roles: AdminUserRole[];
    }> {
      return httpRequest(`/users/${id}/roles`);
    },

    setUserRoles(id: string, roles: string[]): Promise<void> {
      return httpRequest<void>(`/users/${id}/roles`, {
        method: "POST",
        body: { roles },
      });
    },

    sendUserInvite(id: string): Promise<{
      success: boolean;
      expires_at: string;
    }> {
      return httpRequest(`/users/${id}/invite`, { method: "POST", body: {} });
    },

    async listRoleOptions(): Promise<RoleOption[]> {
      try {
        const data = await httpRequest<{ data: RoleOption[] }>("/admin/rbac/roles");
        return Array.isArray(data) ? data : (data as any).data ?? [];
      } catch {
        return [
          { id: "staff", slug: "staff", name: "Staff" },
          { id: "hr_manager", slug: "hr_manager", name: "HR Manager" },
          { id: "accountant", slug: "accountant", name: "Accountant" },
          { id: "finance_manager", slug: "finance_manager", name: "Finance Manager" },
          { id: "admin", slug: "admin", name: "Admin" },
        ];
      }
    },
  };
}
