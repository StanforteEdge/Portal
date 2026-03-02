import apiClient from "@/utils/httpClient";

export type PermissionRecord = {
  id: string;
  name: string;
  slug: string;
  module: string | null;
  description?: string | null;
};

export type RoleRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  permissions: PermissionRecord[];
  users?: Array<{ profile_id: string }>;
};

export async function listRbacRoles(includeInactive = true) {
  const response = await apiClient.get("/admin/rbac/roles", {
    params: { include_inactive: includeInactive ? "true" : undefined },
  });
  return (response.data?.data ?? []) as RoleRecord[];
}

export async function listRbacPermissions(params?: { module?: string; search?: string }) {
  const response = await apiClient.get("/admin/rbac/permissions", {
    params: {
      ...(params?.module ? { module: params.module } : {}),
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return (response.data?.data ?? []) as PermissionRecord[];
}

export async function createRbacRole(payload: {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: string[];
}) {
  const response = await apiClient.post("/admin/rbac/roles", payload);
  return response.data?.data as RoleRecord;
}

export async function updateRbacRole(
  id: string,
  payload: {
    name?: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
    permission_ids?: string[];
  }
) {
  const response = await apiClient.post(`/admin/rbac/roles/${id}`, payload);
  return response.data?.data as RoleRecord;
}

export async function setRbacRolePermissions(id: string, permissionIds: string[]) {
  const response = await apiClient.post(`/admin/rbac/roles/${id}/permissions`, {
    permission_ids: permissionIds,
  });
  return response.data?.data as RoleRecord;
}

export async function createRbacPermission(payload: {
  name: string;
  slug?: string;
  module?: string;
  description?: string;
}) {
  const response = await apiClient.post("/admin/rbac/permissions", payload);
  return response.data?.data as PermissionRecord;
}
