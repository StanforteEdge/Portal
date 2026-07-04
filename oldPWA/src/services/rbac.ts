import apiClient from "@/utils/httpClient";

export type PermissionRecord = {
  id: string;
  name: string;
  slug: string;
  module: string | null;
  description?: string | null;
  roles?: Array<{ id: string; name: string; slug: string }>;
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

export async function deleteRbacRole(id: string) {
  const response = await apiClient.delete(`/admin/rbac/roles/${id}`);
  return response.data?.data as { success: boolean };
}

export async function getRbacRoleDeleteImpact(id: string) {
  const response = await apiClient.get(`/admin/rbac/roles/${id}/delete-impact`);
  return response.data?.data as {
    role: { id: string; name: string; slug: string };
    usage: {
      assignment_count: number;
      assignments: Array<{
        id: string;
        profile_id: string;
        email: string;
        username: string | null;
        organization: { id: string; name: string; code: string } | null;
      }>;
    };
  };
}

export async function deleteRbacRoleWithReplacement(id: string, replacementRoleId: string) {
  const response = await apiClient.delete(`/admin/rbac/roles/${id}`, {
    params: { replacement_role_id: replacementRoleId },
  });
  return response.data?.data as { success: boolean; reassigned_assignments: number };
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

export async function updateRbacPermission(
  id: string,
  payload: {
    name?: string;
    slug?: string;
    module?: string;
    description?: string;
  }
) {
  const response = await apiClient.post(`/admin/rbac/permissions/${id}`, payload);
  return response.data?.data as PermissionRecord;
}

export async function deleteRbacPermission(id: string) {
  const response = await apiClient.delete(`/admin/rbac/permissions/${id}`);
  return response.data?.data as { success: boolean };
}

export async function getRbacPermissionDeleteImpact(id: string) {
  const response = await apiClient.get(`/admin/rbac/permissions/${id}/delete-impact`);
  return response.data?.data as {
    permission: { id: string; name: string; slug: string; module: string | null };
    usage: { role_count: number; roles: Array<{ id: string; name: string; slug: string }> };
  };
}

export async function deleteRbacPermissionWithReplacement(id: string, replacementPermissionId: string) {
  const response = await apiClient.delete(`/admin/rbac/permissions/${id}`, {
    params: { replacement_permission_id: replacementPermissionId },
  });
  return response.data?.data as { success: boolean; affected_roles: number };
}
