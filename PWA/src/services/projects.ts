import apiClient from "@/utils/httpClient";

export type ProjectOption = {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
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
  }>;
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    organizationId: item.organizationId ?? item.organization_id ?? null,
  })) as ProjectOption[];
}

export async function createProject(payload: { name: string; description?: string; organization_id?: string }) {
  const response = await apiClient.post("/projects", payload);
  return response.data?.data as Record<string, unknown>;
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string; is_active?: boolean }
) {
  const response = await apiClient.post(`/projects/${id}`, payload);
  return response.data?.data as Record<string, unknown>;
}
