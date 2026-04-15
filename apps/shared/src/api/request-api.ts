// apps/shared/src/api/request-api.ts
import type { HttpRequest } from "../auth/http-client";

export type RequestType = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  is_active: boolean;
  metadata?: any;
};

export type ResourceRequest = {
  id: string;
  user_id: string;
  request_type_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  start_date?: string;
  end_date?: string;
  metadata?: any;
};

export function createRequestApi(httpRequest: HttpRequest) {
  return {
    async listTypes(params?: { group_id?: string; category?: string }) {
      const query = new URLSearchParams();
      if (params?.group_id) query.set("group_id", params.group_id);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await httpRequest<any[]>(`/requests/types${suffix}`);
      
      let allTypes = (res || []).map((t: any) => ({
        id: String(t.id),
        name: String(t.name),
        slug: String(t.slug ?? t.code_prefix),
        category: t.category ?? t.category_key,
        is_active: Boolean(t.is_active ?? true),
        metadata: (t.form_schema && typeof t.form_schema === 'object' && t.form_schema.metadata) 
          ? t.form_schema.metadata 
          : {},
      })) as RequestType[];

      if (params?.category) {
        allTypes = allTypes.filter(t => t.category === params.category);
      }
      return allTypes;
    },

    async listMyRequests(params?: { type_id?: string; status?: string }) {
      const query = new URLSearchParams();
      if (params?.type_id) query.set("type_id", params.type_id);
      if (params?.status) query.set("status", params.status);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return httpRequest<ResourceRequest[]>(`/requests/me${suffix}`);
    },

    async createRequest(dto: Partial<ResourceRequest>) {
      return httpRequest<ResourceRequest>("/requests", {
        method: "POST",
        body: dto,
      });
    },

    async saveType(dto: Partial<RequestType>, id?: string, groupId?: string) {
      const method = id ? "PATCH" : "POST";
      const path = id ? `/requests/types/${id}` : "/requests/types";
      
      const payload: any = { ...dto };
      if (payload.metadata) {
        payload.form_schema = { metadata: payload.metadata };
        delete payload.metadata;
      }
      if (payload.slug) {
        payload.code_prefix = payload.slug.substring(0, 10).toUpperCase();
      }
      if (payload.category) {
        payload.category_key = payload.category;
      }
      if (!id && groupId) {
        payload.group_id = groupId;
      }

      return httpRequest<RequestType>(path, {
        method,
        body: payload,
      });
    },

    async deleteType(id: string) {
      return httpRequest<void>(`/requests/types/${id}`, {
        method: "DELETE",
      });
    },

    async listGroups() {
      return httpRequest<any[]>("/requests/groups");
    }
  };
}
