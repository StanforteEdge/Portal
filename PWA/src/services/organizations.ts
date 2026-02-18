import apiClient from "@/utils/httpClient";

export type MyOrganization = {
  is_primary: boolean;
  organization: {
    id: string;
    name: string;
    code: string;
  };
};

export type OrganizationRecord = {
  id: string;
  name: string;
  code: string;
  organization_type: "group" | "venture" | "shared_function";
  is_active: boolean;
  parent_organization_id: string | null;
};

export async function listMyOrganizations() {
  const response = await apiClient.get("/organizations/my");
  return (response.data?.data ?? []) as MyOrganization[];
}

export async function listOrganizations(params?: { is_active?: boolean; search?: string }) {
  const response = await apiClient.get("/organizations", {
    params: {
      ...(params?.is_active !== undefined ? { is_active: String(params.is_active) } : {}),
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  const data = (response.data?.data ?? []) as any[];
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    organization_type: (row.organization_type ?? row.organizationType ?? "venture") as OrganizationRecord["organization_type"],
    is_active: Boolean(row.is_active ?? row.isActive ?? true),
    parent_organization_id: row.parent_organization_id ?? row.parentOrganizationId ?? null,
  })) as OrganizationRecord[];
}

export async function createOrganization(payload: {
  name: string;
  code: string;
  organization_type?: "group" | "venture" | "shared_function";
  is_active?: boolean;
  parent_organization_id?: string | null;
}) {
  const response = await apiClient.post("/organizations", payload);
  return response.data?.data as Record<string, unknown>;
}

export async function updateOrganization(
  id: string,
  payload: {
    name?: string;
    code?: string;
    organization_type?: "group" | "venture" | "shared_function";
    is_active?: boolean;
    parent_organization_id?: string | null;
  }
) {
  const response = await apiClient.put(`/organizations/${id}`, payload);
  return response.data?.data as Record<string, unknown>;
}
