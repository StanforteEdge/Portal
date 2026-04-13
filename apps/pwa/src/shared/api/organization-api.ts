import { httpRequest } from "@/shared/lib/core";

export type OrganizationRecord = {
  id: string;
  name: string;
  code: string;
  organization_type: "group" | "venture" | "shared_function";
  is_active: boolean;
  parent_organization_id?: string | null;
};

export async function listOrganizations(params?: {
  is_active?: boolean;
  search?: string;
}): Promise<OrganizationRecord[]> {
  const response = await httpRequest<any>("/organizations", {
    auth: true,
  });
  
  const data = Array.isArray(response) ? response : response?.data ?? [];
  return data.map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    organization_type: (row.organization_type ?? row.organizationType ?? "venture") as OrganizationRecord["organization_type"],
    is_active: Boolean(row.is_active ?? row.isActive ?? true),
    parent_organization_id: row.parent_organization_id ?? row.parentOrganizationId ?? null,
  }));
}
