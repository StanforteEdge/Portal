import apiClient from "@/utils/httpClient";

export type ProjectOption = {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
  governance?: {
    project_code?: string | null;
    owner_user_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    governance_status?: string | null;
  };
};

export async function listProjects(params?: { active_only?: boolean; search?: string }) {
  const response = await apiClient.get("/projects", {
    params: {
      active_only: params?.active_only === false ? undefined : "true",
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  const data = (response.data?.data ?? []) as Array<{
    id: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
    is_active?: boolean;
    organizationId?: string | null;
    organization_id?: string | null;
    governance?: ProjectOption["governance"];
  }>;
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    organizationId: item.organizationId ?? item.organization_id ?? null,
    governance: (item.governance ?? null) as ProjectOption["governance"],
  })) as ProjectOption[];
}

export async function createProject(payload: {
  name: string;
  description?: string;
  organization_id?: string;
  owner_user_id?: string;
  project_code?: string;
  start_date?: string;
  end_date?: string;
  governance_status?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await apiClient.post("/projects", payload);
  return response.data?.data as Record<string, unknown>;
}

export async function updateProject(
  id: string,
  payload: {
    name?: string;
    description?: string;
    is_active?: boolean;
    owner_user_id?: string;
    project_code?: string;
    start_date?: string;
    end_date?: string;
    governance_status?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const response = await apiClient.post(`/projects/${id}`, payload);
  return response.data?.data as Record<string, unknown>;
}

export async function getProject(id: string) {
  const response = await apiClient.get(`/projects/${id}`);
  return response.data?.data as Record<string, unknown>;
}

export async function addProjectMember(id: string, payload: { user_id: string; role?: "member" | "lead" | "manager" }) {
  const roleMap = { member: "member", lead: "moderator", manager: "admin" } as const;
  const response = await apiClient.post(`/projects/${id}/members`, {
    user_id: payload.user_id,
    role: roleMap[payload.role ?? "member"],
  });
  return response.data?.data as Record<string, unknown>;
}

export async function removeProjectMember(id: string, userId: string) {
  const response = await apiClient.delete(`/projects/${id}/members/${userId}`);
  return response.data?.data as Record<string, unknown>;
}

export async function archiveProject(id: string) {
  const response = await apiClient.post(`/projects/${id}/archive`);
  return response.data?.data as Record<string, unknown>;
}

export async function unarchiveProject(id: string) {
  const response = await apiClient.post(`/projects/${id}/unarchive`);
  return response.data?.data as Record<string, unknown>;
}

export async function getProjectGovernance(id: string) {
  const response = await apiClient.get(`/projects/${id}/governance`);
  return response.data?.data as {
    project: Record<string, unknown>;
    usage: { request_references: number; open_requests: number };
  };
}
