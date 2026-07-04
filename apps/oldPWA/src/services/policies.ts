import apiClient from "@/utils/httpClient";

export type PolicyRecord = {
  id: string;
  module: string;
  policy_key: string;
  scope_type: string;
  scope_id: string | null;
  priority: number;
  config_json: Record<string, unknown>;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  document_id: string | null;
  document_version: string | null;
  require_acknowledgement: boolean;
  document: { id: string; title: string; version: string; status: string } | null;
  created_at: string;
  updated_at: string;
};

export async function listPolicies(params?: Record<string, unknown>) {
  const response = await apiClient.get("/policies", { params });
  const payload = response.data?.data;
  if (Array.isArray(payload?.data)) return payload as { data: PolicyRecord[]; meta: any };
  return {
    data: Array.isArray(payload) ? (payload as PolicyRecord[]) : [],
    meta: response.data?.meta ?? {},
  };
}

export async function createPolicy(payload: {
  module: string;
  policy_key: string;
  scope_type?: string;
  scope_id?: string;
  priority?: number;
  config_json: Record<string, unknown>;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  document_id?: string;
  document_version?: string;
  require_acknowledgement?: boolean;
}) {
  const response = await apiClient.post("/policies", payload);
  return response.data?.data as PolicyRecord;
}

export async function updatePolicy(id: string, payload: Partial<{
  module: string;
  policy_key: string;
  scope_type: string;
  scope_id: string;
  priority: number;
  config_json: Record<string, unknown>;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  document_id: string;
  document_version: string;
  require_acknowledgement: boolean;
}>) {
  const response = await apiClient.post(`/policies/${id}`, payload);
  return response.data?.data as PolicyRecord;
}

export async function resolvePolicy(payload: {
  module: string;
  policy_key: string;
  context?: {
    organization_id?: string;
    team_id?: string;
    staff_type?: string;
    user_id?: string;
  };
}) {
  const response = await apiClient.post("/policies/resolve", payload);
  return response.data?.data as {
    module: string;
    policy_key: string;
    resolved: PolicyRecord | null;
    merged_config: Record<string, unknown>;
    applied: PolicyRecord[];
  };
}
