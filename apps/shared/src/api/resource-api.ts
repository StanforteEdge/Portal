// apps/shared/src/api/resource-api.ts
import type { HttpRequest } from "../auth/http-client";

export type OrganizationItem = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

export type TeamItem = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
};

export type OrganizationMapping = {
  id: string;
  organizationId: string;
  isPrimary: boolean;
  organization: { id: string; name: string; code: string };
};

export type TeamMember = {
  userId: string;
  role: "member" | "lead" | "manager";
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  scopeOrganizationIds?: string[];
  organizationScopes?: Array<{
    id: string;
    organizationId: string;
    scopeRole?: string | null;
    organization: { id: string; name: string; code: string };
  }>;
};

export type TeamOption = {
  id: string;
  name: string;
  groupType?: string;
  description?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
  organizationIds?: string[];
  organizationMappings?: OrganizationMapping[];
  members?: TeamMember[];
};

function mapRole(role: string): "member" | "lead" | "manager" {
  if (role === "moderator") return "lead";
  if (role === "admin") return "manager";
  return "member";
}

function mapTeam(item: any): TeamOption {
  const orgMappings = item.organization_mappings ?? item.organizationMappings ?? [];
  const orgIds = item.organization_ids ?? orgMappings.map((m: any) => m.organization_id ?? m.organizationId).filter(Boolean);
  return {
    id: String(item.id),
    name: String(item.name ?? ""),
    groupType: String(item.type ?? item.group_type ?? "team"),
    description: item.description ?? null,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    organizationId: item.organizationId ?? item.organization_id ?? null,
    organizationIds: orgIds.map((id: any) => String(id)),
    organizationMappings: (item.organization_mappings ?? item.organizationMappings ?? []).map((mapping: any) => ({
      id: String(mapping.id ?? ""),
      organizationId: String(mapping.organization_id ?? mapping.organizationId ?? ""),
      isPrimary: Boolean(mapping.is_primary ?? mapping.isPrimary ?? false),
      organization: {
        id: String(mapping.organization?.id ?? ""),
        name: String(mapping.organization?.name ?? ""),
        code: String(mapping.organization?.code ?? ""),
      },
    })),
    members: (item.members ?? []).map((member: any) => ({
      userId: String(member.userId ?? member.user_id ?? ""),
      role: mapRole(String(member.role || "member")),
      user: {
        id: String(member.user?.id ?? ""),
        email: String(member.user?.email ?? ""),
        username: String(member.user?.username ?? ""),
        firstName: member.user?.firstName ?? null,
        lastName: member.user?.lastName ?? null,
      },
      scopeOrganizationIds: (member.scope_organization_ids ?? member.organizationScopes ?? []).map((entry: any) =>
        String(entry.organization_id ?? entry.organizationId ?? entry)
      ),
      organizationScopes: (member.organization_scopes ?? member.organizationScopes ?? []).map((scope: any) => ({
        id: String(scope.id ?? ""),
        organizationId: String(scope.organization_id ?? scope.organizationId ?? ""),
        scopeRole: scope.scope_role ?? scope.scopeRole ?? null,
        organization: {
          id: String(scope.organization?.id ?? ""),
          name: String(scope.organization?.name ?? ""),
          code: String(scope.organization?.code ?? ""),
        },
      })),
    })),
  };
}

export function createResourceApi(httpRequest: HttpRequest) {
  return {
    async listOrganizations() {
      const response = await httpRequest<any>("/organizations");
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        code: String(row.code),
        is_active: Boolean(row.is_active ?? true)
      })) as OrganizationItem[];
    },

    async listGroups(params?: {
      active_only?: boolean;
      search?: string;
      organization_id?: string;
      group_type?: string;
    }) {
      const query = new URLSearchParams();
      if (params?.active_only !== undefined) {
        query.set("active_only", params.active_only ? "true" : "false");
      }
      if (params?.search) query.set("search", params.search);
      if (params?.organization_id) query.set("organization_id", params.organization_id);
      if (params?.group_type) query.set("group_type", params.group_type);
      const qs = query.toString();
      const path = qs ? `/groups?${qs}` : "/groups";
      const response = await httpRequest<any>(path);
      const data = Array.isArray(response) ? response : (response?.data ?? []) as Array<any>;
      return data.map(mapTeam) as TeamOption[];
    },

    async getGroupDetail(id: string) {
      const response = await httpRequest<any>(`/groups/${id}`);
      return mapTeam(response?.data ?? {});
    },

    async createGroup(payload: {
      name: string;
      description?: string;
      organization_id?: string;
      organization_ids?: string[];
      primary_organization_id?: string;
      group_type?: string;
    }) {
      const response = await httpRequest<any>("/groups", {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async updateGroup(
      id: string,
      payload: {
        name?: string;
        description?: string;
        organization_id?: string;
        organization_ids?: string[];
        primary_organization_id?: string;
        is_active?: boolean;
        group_type?: string;
      }
    ) {
      const response = await httpRequest<any>(`/groups/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async addGroupMember(
      id: string,
      payload: { user_id: string; role: "member" | "lead" | "manager"; organization_ids?: string[] }
    ) {
      const response = await httpRequest<any>(`/groups/${id}/members`, {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async removeGroupMember(id: string, userId: string) {
      const response = await httpRequest<any>(`/groups/${id}/members/${userId}`, {
        method: "DELETE",
      });
      return response?.data as Record<string, unknown>;
    },

    async setGroupOrganizations(
      id: string,
      payload: { organization_ids: string[]; primary_organization_id?: string }
    ) {
      const response = await httpRequest<any>(`/groups/${id}/organizations`, {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async setGroupMemberScopes(
      id: string,
      userId: string,
      payload: { organization_ids: string[]; scope_role?: string }
    ) {
      const response = await httpRequest<any>(`/groups/${id}/members/${userId}/scopes`, {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async listProjects(params?: {
      active_only?: boolean;
      search?: string;
    }) {
      const query = new URLSearchParams();
      if (params?.active_only !== undefined) {
        query.set("active_only", params.active_only ? "true" : "false");
      }
      if (params?.search) query.set("search", params.search);
      const qs = query.toString();
      const path = qs ? `/projects?${qs}` : "/projects";
      const response = await httpRequest<any>(path);
      const data = Array.isArray(response) ? response : (response?.data ?? []) as Array<any>;
      return data.map((item: any) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
        description: item.description ?? null,
        isActive: Boolean(item.isActive ?? item.is_active ?? true),
        organizationId: item.organizationId ?? item.organization_id ?? null,
        governance: item.governance ?? null,
      }));
    },

    async getProject(id: string) {
      const response = await httpRequest<any>(`/projects/${id}`);
      const item = Array.isArray(response) ? response[0] : response?.data ?? response;
      return {
        id: String(item.id),
        name: String(item.name ?? ""),
        description: item.description ?? null,
        isActive: Boolean(item.isActive ?? item.is_active ?? true),
        organizationId: item.organizationId ?? item.organization_id ?? null,
        governance: item.governance ?? null,
      };
    },

    async createProject(payload: {
      name: string;
      description?: string;
      organization_id?: string;
      owner_user_id?: string;
      project_code?: string;
      start_date?: string;
      end_date?: string;
      governance_status?: string;
    }) {
      const response = await httpRequest<any>("/projects", {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async updateProject(
      id: string,
      payload: {
        name?: string;
        description?: string;
        is_active?: boolean;
        owner_user_id?: string;
        project_code?: string;
        start_date?: string;
        end_date?: string;
        governance_status?: string;
      }
    ) {
      const response = await httpRequest<any>(`/projects/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data as Record<string, unknown>;
    },

    async archiveProject(id: string) {
      const response = await httpRequest<any>(`/projects/${id}/archive`, {
        method: "POST",
      });
      return response?.data as Record<string, unknown>;
    },

    async unarchiveProject(id: string) {
      const response = await httpRequest<any>(`/projects/${id}/unarchive`, {
        method: "POST",
      });
      return response?.data as Record<string, unknown>;
    },

    async listFiles(params?: {
      search?: string;
      include_usage?: boolean;
      page?: number;
      per_page?: number;
      file_type?: "images" | "videos" | "documents";
      attached?: boolean;
    }) {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.include_usage) query.set("include_usage", "true");
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.file_type) query.set("file_type", params.file_type);
      if (params?.attached !== undefined) query.set("attached", String(params.attached));
      const qs = query.toString();
      const path = qs ? `/files?${qs}` : "/files";
      const response = await httpRequest<any>(path);
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows.map((row: any) => ({
        id: String(row.id),
        file_name: String(row.file_name ?? row.fileName ?? ""),
        mime_type: row.mime_type ?? row.mimeType ?? null,
        file_size: row.file_size ?? row.fileSize ?? null,
        storage_path: String(row.storage_path ?? row.storagePath ?? ""),
        public_url: row.public_url ?? row.publicUrl ?? null,
        usage: row.usage ? {
          attached: Boolean(row.usage.attached),
          request_items: Number(row.usage.request_items ?? 0),
          pv_evidence: Number(row.usage.pv_evidence ?? 0),
          retirement_refs: Number(row.usage.retirement_refs ?? 0),
        } : undefined,
      }));
    },

    async uploadFile(file: File, options?: { organization_id?: string; metadata?: Record<string, unknown> }) {
      const form = new FormData();
      form.append("file", file);
      if (options?.organization_id) form.append("organization_id", options.organization_id);
      if (options?.metadata) form.append("metadata_json", JSON.stringify(options.metadata));
      const response = await httpRequest<any>("/files/upload", {
        method: "POST",
        body: form,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const row = response?.data ?? response;
      return {
        id: String(row.id),
        file_name: String(row.file_name ?? row.fileName ?? file.name),
        mime_type: row.mime_type ?? row.mimeType ?? file.type ?? null,
        file_size: row.file_size ?? row.fileSize ?? file.size,
        storage_path: String(row.storage_path ?? row.storagePath ?? ""),
        public_url: row.public_url ?? row.publicUrl ?? null,
      };
    },

    async deleteFile(fileId: string) {
      const response = await httpRequest<any>(`/files/${fileId}`, {
        method: "DELETE",
      });
      return response?.data as { success: boolean };
    },

    async listChartAccounts(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value != null && value !== "") query.set(key, String(value));
        });
      }
      const qs = query.toString();
      const path = qs ? `/finance/chart-accounts?${qs}` : "/finance/chart-accounts";
      const response = await httpRequest<any>(path);
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows.map((row: any) => ({
        id: String(row.id),
        code: String(row.code ?? ""),
        name: String(row.name ?? ""),
        type: String(row.type ?? "asset"),
        category: String(row.category ?? ""),
        normal_balance: String(row.normal_balance ?? "debit"),
        is_control_account: Boolean(row.is_control_account),
        is_active: Boolean(row.is_active ?? true),
        finance_account: row.finance_account ? {
          id: String(row.finance_account.id),
          name: String(row.finance_account.name ?? ""),
          code: row.finance_account.code ?? null,
          account_type: String(row.finance_account.account_type ?? ""),
        } : null,
        organization: row.organization ? {
          id: String(row.organization.id),
          name: String(row.organization.name ?? ""),
          code: String(row.organization.code ?? ""),
        } : null,
      }));
    },

    async createChartAccount(payload: {
      code: string;
      name: string;
      type: string;
      category?: string;
      normal_balance?: string;
      is_control_account?: boolean;
      is_active?: boolean;
    }) {
      const response = await httpRequest<any>("/finance/chart-accounts", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async updateChartAccount(id: string, payload: {
      code?: string;
      name?: string;
      type?: string;
      category?: string;
      normal_balance?: string;
      is_control_account?: boolean;
      is_active?: boolean;
    }) {
      const response = await httpRequest<any>(`/finance/chart-accounts/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listFinanceAccounts(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value != null && value !== "") query.set(key, String(value));
        });
      }
      const qs = query.toString();
      const path = qs ? `/finance/accounts?${qs}` : "/finance/accounts";
      const response = await httpRequest<any>(path);
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        code: row.code ?? null,
        account_type: String(row.account_type ?? "bank"),
        bank_name: row.bank_name ?? null,
        account_name: row.account_name ?? null,
        account_number: row.account_number ?? null,
        branch_name: row.branch_name ?? null,
        currency: String(row.currency ?? "NGN"),
        opening_balance: Number(row.opening_balance ?? 0),
        current_balance: Number(row.current_balance ?? 0),
        is_active: Boolean(row.is_active ?? row.isActive ?? true),
      }));
    },

    async createFinanceAccount(payload: {
      name: string;
      code?: string;
      account_type?: string;
      bank_name?: string;
      account_name?: string;
      account_number?: string;
      branch_name?: string;
      currency?: string;
      opening_balance?: number;
      is_active?: boolean;
    }) {
      const response = await httpRequest<any>("/finance/accounts", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async updateFinanceAccount(id: string, payload: {
      name?: string;
      code?: string;
      account_type?: string;
      bank_name?: string;
      account_name?: string;
      account_number?: string;
      branch_name?: string;
      currency?: string;
      opening_balance?: number;
      is_active?: boolean;
    }) {
      const response = await httpRequest<any>(`/finance/accounts/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listFinanceIncome(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/income?${qs}` : "/finance/income");
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows.map((row: any) => ({
        id: String(row.id),
        account_id: String(row.account_id ?? ""),
        account_name: row.account_name ?? "",
        amount: Number(row.amount ?? 0),
        currency: String(row.currency ?? "NGN"),
        received_at: row.received_at ?? null,
        reference: row.reference ?? null,
        payer: row.payer ?? null,
        notes: row.notes ?? null,
        fund_id: row.fund_id ?? null,
        grant_id: row.grant_id ?? null,
        file: row.file ?? null,
      }));
    },

    async createFinanceIncome(payload: {
      account_id: string;
      amount: number;
      currency?: string;
      received_at?: string;
      reference?: string;
      payer?: string;
      notes?: string;
      file_id?: string;
      fund_id?: string;
      grant_id?: string;
    }) {
      const response = await httpRequest<any>("/finance/income", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listFinanceBills(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/bills?${qs}` : "/finance/bills");
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows;
    },

    async createFinanceBill(payload: Record<string, unknown>) {
      const response = await httpRequest<any>("/finance/bills", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listSalesInvoices(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/sales-invoices?${qs}` : "/finance/sales-invoices");
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows;
    },

    async createSalesInvoice(payload: Record<string, unknown>) {
      const response = await httpRequest<any>("/finance/sales-invoices", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listFinanceVendors(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/vendors?${qs}` : "/finance/vendors");
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows;
    },

    async listFinanceItems(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/items?${qs}` : "/finance/items");
      const payload = Array.isArray(response) ? { data: response, meta: {} } : (response?.data ? { data: response.data, meta: response.meta ?? {} } : { data: [], meta: {} });
      const rows = Array.isArray(payload.data) ? payload.data : [];
      return {
        data: rows,
        meta: payload.meta,
      };
    },

    async createFinanceItem(payload: Record<string, unknown>) {
      const response = await httpRequest<any>("/finance/items", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async updateFinanceItem(id: string, payload: Record<string, unknown>) {
      const response = await httpRequest<any>(`/finance/items/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async listFinanceExpenses(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== "") query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/expenses?${qs}` : "/finance/expenses");
      const payload = Array.isArray(response) ? { data: response, meta: {} } : (response?.data ? { data: response.data, meta: response.meta ?? {} } : { data: [], meta: {} });
      const rows = Array.isArray(payload.data) ? payload.data : [];
      return {
        data: rows,
        meta: payload.meta,
      };
    },

    async createFinanceExpense(payload: Record<string, unknown>) {
      const response = await httpRequest<any>("/finance/expenses", {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },

    async updateFinanceExpense(id: string, payload: Record<string, unknown>) {
      const response = await httpRequest<any>(`/finance/expenses/${id}`, {
        method: "POST",
        body: payload,
      });
      return response?.data;
    },
  };
}
