// apps/shared/src/api/request-api.ts
import type { HttpRequest } from "../auth/http-client";

export type RequestType = {
  id: string;
  group_id?: string | null;
  groupId?: string | null;
  name: string;
  slug: string;
  category?: string;
  is_active: boolean;
  description?: string | null;
  form_schema?: Record<string, unknown> | null;
  formSchema?: Record<string, unknown> | null;
  approval_flow_json?: Record<string, unknown> | null;
  approvalFlowJson?: Record<string, unknown> | null;
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
  function normalizeType(raw: any): RequestType {
    const formSchema =
      (raw?.form_schema && typeof raw.form_schema === 'object' ? raw.form_schema : null) ||
      (raw?.formSchema && typeof raw.formSchema === 'object' ? raw.formSchema : null);
    const approvalFlow =
      (raw?.approval_flow_json && typeof raw.approval_flow_json === 'object'
        ? raw.approval_flow_json
        : null) ||
      (raw?.approvalFlowJson && typeof raw.approvalFlowJson === 'object'
        ? raw.approvalFlowJson
        : null);

    return {
      id: String(raw?.id ?? ''),
      group_id: raw?.group_id ?? raw?.groupId ?? null,
      groupId: raw?.groupId ?? raw?.group_id ?? null,
      name: String(raw?.name ?? ''),
      slug: String(raw?.slug ?? raw?.code_prefix ?? raw?.codePrefix ?? ''),
      category: raw?.category ?? raw?.category_key ?? raw?.categoryKey ?? undefined,
      is_active: Boolean(raw?.is_active ?? raw?.isActive ?? true),
      description: raw?.description ?? null,
      form_schema: formSchema,
      formSchema,
      approval_flow_json: approvalFlow,
      approvalFlowJson: approvalFlow,
      metadata:
        (formSchema && typeof formSchema.metadata === 'object' ? formSchema.metadata : null) ||
        {},
    };
  }

  return {
    async listTypes(params?: { group_id?: string; category?: string }) {
      const query = new URLSearchParams();
      if (params?.group_id) query.set("group_id", params.group_id);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await httpRequest<any>(`/requests/types${suffix}`);
      const list: unknown[] = (res as any)?.data?.items ?? [];
      let allTypes: RequestType[] = list.map((entry) => normalizeType(entry));

      if (params?.category) {
        allTypes = allTypes.filter((type) => type.category === params.category);
      }
      return allTypes;
    },

    async listMyRequests(params?: { type_id?: string; status?: string }) {
      const query = new URLSearchParams();
      if (params?.type_id) query.set("type_id", params.type_id);
      if (params?.status) query.set("status", params.status);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await httpRequest<any>(`/requests/me${suffix}`);
      return ((res as any)?.data?.items ?? []) as ResourceRequest[];
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
      const dtoAliases = dto as Partial<{
        code_prefix: string;
        codePrefix: string;
        category_key: string;
        categoryKey: string;
        formSchema: Record<string, unknown> | null;
        approvalFlowJson: Record<string, unknown> | null;
      }>;

      // Build API payload explicitly so alias fields (slug/category) are never sent.
      const payload: Record<string, unknown> = {};
      if (dto.name !== undefined) payload.name = dto.name;
      if (dto.description !== undefined) payload.description = dto.description;
      if (dto.is_active !== undefined) payload.is_active = dto.is_active;

      const explicitCodePrefix =
        (typeof dtoAliases.code_prefix === "string" ? dtoAliases.code_prefix : "") ||
        (typeof dtoAliases.codePrefix === "string" ? dtoAliases.codePrefix : "");
      const codePrefix =
        explicitCodePrefix.trim() ||
        (!id && dto.slug ? String(dto.slug).trim() : "");
      if (codePrefix) {
        payload.code_prefix = codePrefix.substring(0, 10).toUpperCase();
      }

      const explicitCategoryKey =
        (typeof dtoAliases.category_key === "string" ? dtoAliases.category_key : "") ||
        (typeof dtoAliases.categoryKey === "string" ? dtoAliases.categoryKey : "");
      const categoryKey =
        explicitCategoryKey.trim() ||
        (!id && dto.category ? String(dto.category).trim() : "");
      if (categoryKey) {
        payload.category_key = categoryKey;
      }

      if (dto.metadata && typeof dto.metadata === "object") {
        payload.form_schema = { metadata: dto.metadata };
      } else if (dto.form_schema !== undefined) {
        payload.form_schema = dto.form_schema;
      } else if (dtoAliases.formSchema !== undefined) {
        payload.form_schema = dtoAliases.formSchema;
      }

      if (dto.approval_flow_json !== undefined) {
        payload.approval_flow_json = dto.approval_flow_json;
      } else if (dtoAliases.approvalFlowJson !== undefined) {
        payload.approval_flow_json = dtoAliases.approvalFlowJson;
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
      const res = await httpRequest<any>("/requests/groups");
      return ((res as any)?.data?.items ?? []) as any[];
    }
  };
}
