import apiClient from "@/utils/httpClient";

export type TeamOption = {
  id: string;
  name: string;
  groupType?: string;
  description?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
  organizationIds?: string[];
  organizationMappings?: Array<{
    id: string;
    organizationId: string;
    isPrimary: boolean;
    organization: { id: string; name: string; code: string };
  }>;
  members?: Array<{
    userId: string;
    role: "member" | "lead" | "manager";
    user: { id: string; email: string; username: string; firstName?: string | null; lastName?: string | null };
    scopeOrganizationIds?: string[];
    organizationScopes?: Array<{
      id: string;
      organizationId: string;
      scopeRole?: string | null;
      organization: { id: string; name: string; code: string };
    }>;
  }>;
};

function mapRole(role: string): "member" | "lead" | "manager" {
  if (role === "moderator") return "lead";
  if (role === "admin") return "manager";
  return "member";
}

function mapTeam(item: any): TeamOption {
  return {
    id: String(item.id),
    name: String(item.name ?? ""),
    groupType: String(item.type ?? "team"),
    description: item.description ?? null,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    organizationId: item.organizationId ?? item.organization_id ?? null,
    organizationIds: (item.organization_ids ?? item.organizationMappings ?? []).map((entry: any) =>
      String(entry.organization_id ?? entry.organizationId ?? entry)
    ),
    organizationMappings: (item.organization_mappings ?? item.organizationMappings ?? []).map((mapping: any) => ({
      id: String(mapping.id ?? ""),
      organizationId: String(mapping.organization_id ?? mapping.organizationId ?? ""),
      isPrimary: Boolean(mapping.is_primary ?? mapping.isPrimary ?? false),
      organization: {
        id: String(mapping.organization?.id ?? ""),
        name: String(mapping.organization?.name ?? ""),
        code: String(mapping.organization?.code ?? ""),
      },
    })),
    members: (item.members ?? []).map((member: any) => ({
      userId: String(member.userId ?? member.user_id ?? ""),
      role: mapRole(String(member.role || "member")),
      user: {
        id: String(member.user?.id ?? ""),
        email: String(member.user?.email ?? ""),
        username: String(member.user?.username ?? ""),
        firstName: member.user?.firstName ?? null,
        lastName: member.user?.lastName ?? null,
      },
      scopeOrganizationIds: (member.scope_organization_ids ?? member.organizationScopes ?? []).map((entry: any) =>
        String(entry.organization_id ?? entry.organizationId ?? entry)
      ),
      organizationScopes: (member.organization_scopes ?? member.organizationScopes ?? []).map((scope: any) => ({
        id: String(scope.id ?? ""),
        organizationId: String(scope.organization_id ?? scope.organizationId ?? ""),
        scopeRole: scope.scope_role ?? scope.scopeRole ?? null,
        organization: {
          id: String(scope.organization?.id ?? ""),
          name: String(scope.organization?.name ?? ""),
          code: String(scope.organization?.code ?? ""),
        },
      })),
    })),
  };
}

export async function listTeams(params?: {
  active_only?: boolean;
  search?: string;
  organization_id?: string;
  group_type?: string;
}) {
  const response = await apiClient.get("/teams", {
    params: {
      active_only: params?.active_only === false ? undefined : "true",
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.organization_id ? { organization_id: params.organization_id } : {}),
      ...(params?.group_type ? { group_type: params.group_type } : {}),
    },
  });
  const data = (response.data?.data ?? []) as Array<any>;
  return data.map(mapTeam) as TeamOption[];
}

export async function getGroupDetail(id: string) {
  const response = await apiClient.get(`/teams/${id}`);
  return mapTeam(response.data?.data ?? {});
}

export async function createTeam(payload: {
  name: string;
  description?: string;
  organization_id?: string;
  organization_ids?: string[];
  primary_organization_id?: string;
  group_type?: string;
}) {
  const response = await apiClient.post("/teams", payload);
  return response.data?.data as Record<string, unknown>;
}

export async function updateTeam(
  id: string,
  payload: {
    name?: string;
    description?: string;
    organization_id?: string;
    organization_ids?: string[];
    primary_organization_id?: string;
    is_active?: boolean;
    group_type?: string;
  }
) {
  const response = await apiClient.post(`/teams/${id}`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function addGroupMember(
  id: string,
  payload: { user_id: string; role: "member" | "lead" | "manager"; organization_ids?: string[] }
) {
  const response = await apiClient.post(`/teams/${id}/members`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function removeGroupMember(id: string, userId: string) {
  const response = await apiClient.delete(`/teams/${id}/members/${userId}`);
  return response.data?.data as Record<string, unknown>;
}

export async function setGroupOrganizations(
  id: string,
  payload: { organization_ids: string[]; primary_organization_id?: string }
) {
  const response = await apiClient.post(`/teams/${id}/organizations`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function setGroupMemberScopes(
  id: string,
  userId: string,
  payload: { organization_ids: string[]; scope_role?: string }
) {
  const response = await apiClient.post(`/teams/${id}/members/${userId}/scopes`, payload);
  return response.data?.data as Record<string, unknown>;
}
