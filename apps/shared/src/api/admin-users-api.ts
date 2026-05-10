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
    async listUsers(params?: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      type?: string;
      organization_id?: string;
    }): Promise<AdminUsersResponse> {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.type) query.set("type", params.type);
      if (params?.organization_id) query.set("organization_id", params.organization_id);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await httpRequest<any>(`/admin/users${suffix}`);
      const items: AdminUser[] = res?.data?.items ?? [];
      const m = res?.data?.meta ?? {};
      return { data: items, meta: { page: m.page ?? 1, per_page: m.per_page ?? 20, total: m.total ?? 0, last_page: m.pages ?? 1 } };
    },

    async getUser(id: string): Promise<AdminUserDetail> {
      const res = await httpRequest<any>(`/admin/users/${id}`);
      return (res?.data ?? res) as AdminUserDetail;
    },

    async createUser(payload: {
      email: string;
      first_name?: string;
      last_name?: string;
      type?: string;
      status?: string;
      organization_id?: string;
    }): Promise<AdminUser> {
      const res = await httpRequest<any>("/admin/users", {
        method: "POST",
        body: payload,
      });
      return (res?.data ?? res) as AdminUser;
    },

    async updateUser(
      id: string,
      payload: {
        email?: string;
        first_name?: string;
        last_name?: string;
        type?: string;
        organization_id?: string;
      },
    ): Promise<AdminUser> {
      const res = await httpRequest<any>(`/admin/users/${id}`, {
        method: "POST",
        body: payload,
      });
      return (res?.data ?? res) as AdminUser;
    },

    async updateUserStatus(
      id: string,
      payload: { status: string; reason?: string },
    ): Promise<AdminUser> {
      const res = await httpRequest<any>(`/admin/users/${id}/status`, {
        method: "POST",
        body: payload,
      });
      return (res?.data ?? res) as AdminUser;
    },

    async getUserRoles(id: string): Promise<{
      user: { id: string; email: string };
      roles: AdminUserRole[];
    }> {
      const res = await httpRequest<any>(`/users/${id}/roles`);
      return (res?.data ?? res) as { user: { id: string; email: string }; roles: AdminUserRole[] };
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

    async searchUsers(query: string): Promise<AdminUser[]> {
      const q = new URLSearchParams({ search: query, per_page: "20" }).toString();
      const res = await httpRequest<any>(`/admin/users?${q}`);
      return (res?.data?.items ?? (Array.isArray(res?.data) ? res.data : [])) as AdminUser[];
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
