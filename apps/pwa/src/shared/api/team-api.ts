import { httpRequest } from "@/shared/lib/core";

export type TeamOption = {
  id: string;
  name: string;
  type: string;
  role?: string;
  is_active?: boolean;
};

export async function listTeams(params?: {
  active_only?: boolean;
  search?: string;
  organization_id?: string;
  group_type?: string;
}): Promise<TeamOption[]> {
  const queryParams = new URLSearchParams();
  if (params?.active_only !== false) queryParams.set("active_only", "true");
  if (params?.search) queryParams.set("search", params.search);
  if (params?.organization_id) queryParams.set("organization_id", params.organization_id);
  if (params?.group_type) queryParams.set("group_type", params.group_type);
  
  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await httpRequest<any>(`/teams${suffix}`);
  
  const data = Array.isArray(response) ? response : response?.data ?? [];
  return data.map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type ?? row.group_type ?? "team"),
    role: row.role ?? undefined,
    is_active: Boolean(row.is_active ?? row.isActive ?? true),
  }));
}
