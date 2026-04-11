import { httpRequest } from "@/shared/lib/core";

export type ManagedTaxonomy = {
  id: string;
  key: string;
  name: string;
  module: string | null;
  is_active: boolean;
  terms: Array<{ id: string; value: string; label: string; is_active: boolean }>;
};

export type TagTerm = {
  id: string;
  value: string;
  label: string;
  is_active?: boolean;
};

function mapTagTerm(row: any): TagTerm {
  return {
    id: String(row.id),
    value: String(row.value),
    label: String(row.label),
    is_active: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

export async function listManagedTaxonomies(params?: { include_inactive?: boolean; module?: string }) {
  const query = new URLSearchParams();
  if (params?.include_inactive) query.set("include_inactive", "true");
  if (params?.module) query.set("module", params.module);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const rows = await httpRequest<any[]>(`/taxonomy/taxonomies${suffix}`);
  return (rows ?? []).map((row) => ({
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

export async function suggestTagTerms(taxonomyKey: string, query?: string) {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const rows = await httpRequest<any[]>(`/taxonomy/tags/${taxonomyKey}/suggest${suffix}`);
  return (rows ?? []).map(mapTagTerm);
}

export async function replaceEntityTags(
  entityType: string,
  entityId: string,
  taxonomyKey: string,
  payload: { term_ids?: string[]; labels?: string[]; module?: string }
) {
  const query = new URLSearchParams();
  if (payload.module) query.set("module", payload.module);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<{ taxonomy: unknown; tags: TagTerm[] }>(
    `/taxonomy/tags/${entityType}/${entityId}/${taxonomyKey}${suffix}`,
    {
      method: "POST",
      body: {
        term_ids: payload.term_ids ?? [],
        labels: payload.labels ?? [],
      },
    }
  );
}

export async function listEntityTags(entityType: string, entityId: string, taxonomyKey: string) {
  return httpRequest<{ taxonomy: unknown; tags: TagTerm[] }>(
    `/taxonomy/tags/${entityType}/${entityId}/${taxonomyKey}`
  );
}
