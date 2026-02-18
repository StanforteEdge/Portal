import apiClient from "@/utils/httpClient";

export type TeamOption = {
  id: string;
  name: string;
  groupType?: string;
  description?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
  members?: Array<{
    userId: string;
    role: "member" | "lead" | "manager";
    user: { id: string; email: string; username: string; firstName?: string | null; lastName?: string | null };
  }>;
};

function mapRole(role: string): "member" | "lead" | "manager" {
  if (role === "moderator") return "lead";
  if (role === "admin") return "manager";
  return "member";
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
  return data.map((item) => ({
    id: String(item.id),
    name: String(item.name ?? ""),
    groupType: String(item.type ?? "team"),
    description: item.description ?? null,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    organizationId: item.organizationId ?? item.organization_id ?? null,
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
    })),
  })) as TeamOption[];
}

export async function createTeam(payload: {
  name: string;
  description?: string;
  organization_id?: string;
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
    is_active?: boolean;
    group_type?: string;
  }
) {
  const response = await apiClient.post(`/teams/${id}`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function addGroupMember(
  id: string,
  payload: { user_id: string; role: "member" | "lead" | "manager" }
) {
  const response = await apiClient.post(`/teams/${id}/members`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function removeGroupMember(id: string, userId: string) {
  const response = await apiClient.delete(`/teams/${id}/members/${userId}`);
  return response.data?.data as Record<string, unknown>;
}
