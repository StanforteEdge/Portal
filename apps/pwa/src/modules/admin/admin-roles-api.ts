import { httpRequest } from "@/shared/lib/core";

export type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  permissions_count?: number;
  users_count?: number;
  created_at?: string;
};

export type RolePermission = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module?: string;
};

export type RoleResponse = {
  data: Role[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export async function listRoles(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<Role[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const data = await httpRequest<RoleResponse | Role[]>(`/admin/rbac/roles${suffix}`);
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getRole(id: string): Promise<Role & { permissions: RolePermission[] }> {
  return httpRequest<Role & { permissions: RolePermission[] }>(`/admin/rbac/roles/${id}`);
}

export async function createRole(payload: {
  name: string;
  slug: string;
  description?: string;
  permission_slugs?: string[];
}): Promise<Role> {
  return httpRequest<Role>("/admin/rbac/roles", {
    method: "POST",
    body: payload,
  });
}

export async function updateRole(
  id: string,
  payload: {
    name?: string;
    description?: string;
    is_active?: boolean;
    permission_slugs?: string[];
  },
): Promise<Role> {
  return httpRequest<Role>(`/admin/rbac/roles/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteRole(id: string): Promise<void> {
  return httpRequest<void>(`/admin/rbac/roles/${id}`, {
    method: "DELETE",
  });
}

export async function listPermissions(): Promise<RolePermission[]> {
  const data = await httpRequest<{ data: RolePermission[] } | RolePermission[]>(
    "/admin/rbac/permissions",
  );
  return Array.isArray(data) ? data : (data?.data ?? []);
}
