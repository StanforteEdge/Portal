import { httpRequest } from "@/shared/lib/core";

export type ScopeType = "global" | "organization" | "team" | "staff_type" | "user";

export type PolicyRecord = {
  id: string;
  module: string;
  policy_key: string;
  scope_type: ScopeType;
  scope_id?: string;
  config_json: any;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ListPoliciesParams = {
  module?: string;
  policy_key?: string;
  scope_type?: ScopeType;
  scope_id?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
};

/**
 * List policies based on filters
 */
export async function listHrPolicies(params?: ListPoliciesParams): Promise<{ data: PolicyRecord[], meta?: any }> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<{ data: PolicyRecord[], meta: any }>(`/policies${suffix}`);
}

/**
 * Create or update a policy
 */
export async function saveHrPolicy(data: Partial<PolicyRecord>, id?: string): Promise<PolicyRecord> {
  return httpRequest<PolicyRecord>(id ? `/policies/${id}` : "/policies", {
    method: id ? "PATCH" : "POST",
    body: data,
  });
}

// Office Locations
export type OfficeLocation = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  organizations: Array<{ id: string; name: string; is_primary: boolean }>;
};

/**
 * List attendance office locations
 */
export async function listOfficeLocations(params?: { is_active?: boolean }): Promise<{ data: OfficeLocation[] }> {
  const query = new URLSearchParams();
  if (params?.is_active !== undefined) {
    query.set("is_active", String(params.is_active));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<{ data: OfficeLocation[] }>(`/hr/attendance/locations${suffix}`);
}

/**
 * Save an office location (create or update)
 */
export async function saveOfficeLocation(data: any, id?: string): Promise<OfficeLocation> {
  return httpRequest<OfficeLocation>(id ? `/hr/attendance/locations/${id}` : "/hr/attendance/locations", {
    method: id ? "PATCH" : "POST",
    body: data,
  });
}
