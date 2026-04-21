// apps/shared/src/api/policy-api.ts
import type { HttpRequest } from "../auth/http-client";

export type ScopeType = 'organization' | 'team' | 'user' | 'staff_type' | 'global';

export type PolicyRecord = {
  id: string;
  module: string;
  policy_key: string;
  scope_type: ScopeType;
  scope_id: string;
  priority: number;
  config_json: any;
  is_active: boolean;
};

export function createPolicyApi(httpRequest: HttpRequest) {
  return {
    async listPolicies(module: string) {
      const response = await httpRequest<any>(`/policies?module=${module}`);
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data as PolicyRecord[];
    },

    async savePolicy(dto: Partial<PolicyRecord>, id?: string) {
      const method = "POST";
      const url = id ? `/policies/${id}` : "/policies";
      return httpRequest<PolicyRecord>(url, {
        method,
        body: dto,
      });
    },

    async deletePolicy(id: string) {
      return httpRequest<void>(`/policies/${id}`, { method: "DELETE" });
    }
  };
}
