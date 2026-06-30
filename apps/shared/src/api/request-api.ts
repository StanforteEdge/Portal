// apps/shared/src/api/request-api.ts
import type { HttpRequest } from "../auth/http-client";

export type RequestType = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  category_id?: string | null;
  categoryId?: string | null;
  taxonomy_keys?: string[] | null;
  taxonomyKeys?: string[] | null;
  /** Explicit workflow type: 'payment' | 'leave' | 'loan' | 'other'. Overrides auto-detection. */
  workflow_type?: string | null;
  /** Label shown instead of generic 'Finance/Handler' text on action buttons and approval steps. */
  handler_role_label?: string | null;
  /** group / module this type belongs to */
  group_id?: string | null;
  groupId?: string | null;
  is_active: boolean;
  description?: string | null;
  form_schema?: Record<string, unknown> | null;
  formSchema?: Record<string, unknown> | null;
  approval_flow_json?: Record<string, unknown> | null;
  approvalFlowJson?: Record<string, unknown> | null;
  visible_to_roles?: string[];
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

    const categoryRelation =
      raw?.category && typeof raw.category === 'object' && raw.category !== null
        ? raw.category
        : null;

    return {
      id: String(raw?.id ?? ''),
      name: String(raw?.name ?? ''),
      slug: String(raw?.slug ?? raw?.code_prefix ?? raw?.codePrefix ?? ''),
      category: categoryRelation?.name ?? raw?.category ?? raw?.taxonomy_keys?.[0] ?? raw?.taxonomyKeys?.[0] ?? undefined,
      category_id: raw?.category_id ?? raw?.categoryId ?? categoryRelation?.id ?? null,
      categoryId: raw?.categoryId ?? raw?.category_id ?? categoryRelation?.id ?? null,
      taxonomy_keys: raw?.taxonomy_keys ?? raw?.taxonomyKeys ?? null,
      taxonomyKeys: raw?.taxonomyKeys ?? raw?.taxonomy_keys ?? null,
      workflow_type: raw?.workflow_type ?? raw?.workflowType ?? null,
      handler_role_label: raw?.handler_role_label ?? raw?.handlerRoleLabel ?? null,
      group_id: raw?.group_id ?? raw?.groupId ?? null,
      groupId: raw?.groupId ?? raw?.group_id ?? null,
      is_active: Boolean(raw?.is_active ?? raw?.isActive ?? true),
      description: raw?.description ?? null,
      form_schema: formSchema,
      formSchema,
      approval_flow_json: approvalFlow,
      approvalFlowJson: approvalFlow,
      visible_to_roles: raw?.visible_to_roles ?? raw?.visibleToRoles ?? undefined,
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

    async saveType(dto: Partial<RequestType>, id?: string, categoryId?: string) {
      const method = id ? "PATCH" : "POST";
      const path = id ? `/requests/types/${id}` : "/requests/types";
      const dtoAliases = dto as Partial<{
        code_prefix: string;
        codePrefix: string;
        taxonomy_keys: string[];
        taxonomyKeys: string[];
        category_id: string;
        categoryId: string;
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

      const taxonomyKeysArr =
        (Array.isArray(dtoAliases.taxonomy_keys) ? dtoAliases.taxonomy_keys : undefined) ||
        (Array.isArray(dtoAliases.taxonomyKeys) ? dtoAliases.taxonomyKeys : undefined);
      if (taxonomyKeysArr && taxonomyKeysArr.length > 0) {
        payload.taxonomy_keys = taxonomyKeysArr;
      }

      const resolvedCategoryId =
        (typeof dtoAliases.category_id === "string" ? dtoAliases.category_id : "") ||
        (typeof dtoAliases.categoryId === "string" ? dtoAliases.categoryId : "");
      if (resolvedCategoryId) {
        payload.category_id = resolvedCategoryId;
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

      if (dto.visible_to_roles !== undefined) {
        payload.visible_to_roles = dto.visible_to_roles;
      }

      // workflow_type and handler_role_label are always writable (even on edit)
      if ((dto as any).workflow_type !== undefined) {
        payload.workflow_type = (dto as any).workflow_type || null;
      }
      if ((dto as any).handler_role_label !== undefined) {
        payload.handler_role_label = (dto as any).handler_role_label || null;
      }

      if (!id && categoryId) {
        payload.category_id = categoryId;
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
    },

    async checkManualRequestNumber(requestId: string, params?: { request_type_id?: string; exclude_id?: string }) {
      const query = new URLSearchParams();
      query.set("request_id", requestId);
      if (params?.request_type_id) query.set("request_type_id", params.request_type_id);
      if (params?.exclude_id) query.set("exclude_id", params.exclude_id);
      return httpRequest<{ exists: boolean; request_id: string | null }>(`/requests/check-manual-request-number?${query.toString()}`);
    },

    async checkManualVoucherNumber(voucherNumber: string, params?: { exclude_request_id?: string }) {
      const query = new URLSearchParams();
      query.set("voucher_number", voucherNumber);
      if (params?.exclude_request_id) query.set("exclude_request_id", params.exclude_request_id);
      return httpRequest<{ exists: boolean; request_id: string | null }>(`/requests/check-manual-voucher-number?${query.toString()}`);
    },

    async createManualRequestEntry(payload: Record<string, unknown>) {
      return httpRequest<ResourceRequest>("/requests/manual-entry", {
        method: "POST",
        body: payload,
      });
    },

    async updateManualRequestEntry(id: string, payload: Record<string, unknown>) {
      return httpRequest<ResourceRequest>(`/requests/${id}/manual-entry`, {
        method: "POST",
        body: payload,
      });
    },

    async deleteManualRequestEntry(id: string) {
      return httpRequest<void>(`/requests/${id}/manual-entry`, {
        method: "DELETE",
      });
    }
  };
}
