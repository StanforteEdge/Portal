import apiClient from "@/utils/httpClient";

export type TaxonomyPayload = {
  request_groups: Array<{ id: string; name: string; code: string }>;
  request_types: Array<{ id: string; name: string; group_id?: string; groupId?: string }>;
  form_field_taxonomies: Array<{
    id: string;
    form_id: string;
    form_name: string;
    field_key: string;
    field_label: string;
    field_type: string;
    options: string[];
  }>;
};

export type ManagedTaxonomy = {
  id: string;
  key: string;
  name: string;
  module: string | null;
  is_active: boolean;
  terms: Array<{ id: string; value: string; label: string; is_active: boolean }>;
};

export async function listTaxonomy(params?: { group_id?: string; include_inactive?: boolean }) {
  const response = await apiClient.get("/taxonomy", {
    params: {
      ...(params?.group_id ? { group_id: params.group_id } : {}),
      ...(params?.include_inactive ? { include_inactive: "true" } : {}),
    },
  });
  return (response.data?.data ?? {
    request_groups: [],
    request_types: [],
    form_field_taxonomies: [],
  }) as TaxonomyPayload;
}

export async function updateTaxonomyFieldOptions(fieldId: string, options: string[]) {
  const response = await apiClient.post(`/taxonomy/form-fields/${fieldId}/options`, { options });
  return response.data?.data as {
    id: string;
    field_key: string;
    field_label: string;
    options: string[];
  };
}

export async function listManagedTaxonomies(params?: { include_inactive?: boolean; module?: string }) {
  const response = await apiClient.get("/taxonomy/taxonomies", {
    params: {
      ...(params?.include_inactive ? { include_inactive: "true" } : {}),
      ...(params?.module ? { module: params.module } : {}),
    },
  });
  const rows = (response.data?.data ?? []) as any[];
  return rows.map((row) => ({
    id: String(row.id),
    key: String(row.key),
    name: String(row.name),
    module: row.module ?? null,
    is_active: Boolean(row.is_active ?? row.isActive ?? true),
    terms: (row.terms ?? []).map((term: any) => ({
      id: String(term.id),
      value: String(term.value),
      label: String(term.label),
      is_active: Boolean(term.is_active ?? term.isActive ?? true),
    })),
  })) as ManagedTaxonomy[];
}

export async function createManagedTaxonomy(payload: {
  key: string;
  name: string;
  description?: string;
  module?: string;
  is_active?: boolean;
}) {
  const response = await apiClient.post("/taxonomy/taxonomies", payload);
  return response.data?.data as ManagedTaxonomy;
}

export async function updateManagedTaxonomy(
  id: string,
  payload: { key?: string; name?: string; description?: string; module?: string; is_active?: boolean }
) {
  const response = await apiClient.post(`/taxonomy/taxonomies/${id}`, payload);
  return response.data?.data as ManagedTaxonomy;
}

export async function syncManagedTaxonomyTerms(id: string, terms: string[]) {
  const response = await apiClient.post(`/taxonomy/taxonomies/${id}/terms/sync`, { terms });
  return response.data?.data as ManagedTaxonomy;
}
