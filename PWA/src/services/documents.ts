import apiClient from "@/utils/httpClient";

export type PortalDocument = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  version: string;
  effective_date?: string | null;
  content_html?: string | null;
  require_acknowledgement: boolean;
  file?: {
    id: string;
    file_name: string;
    public_url?: string | null;
    storage_path?: string;
    mime_type?: string | null;
  } | null;
  my_acknowledgement?: {
    id: string;
    version: string;
    acknowledged_at: string;
  } | null;
};

export async function listDocuments(params?: Record<string, string | number | boolean | undefined>) {
  const response = await apiClient.get("/documents", { params });
  const payload = response.data.data as any;
  if (Array.isArray(payload)) {
    return {
      data: payload as PortalDocument[],
      meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 },
    };
  }
  return {
    data: Array.isArray(payload?.data) ? (payload.data as PortalDocument[]) : [],
    meta: payload?.meta ?? { page: 1, per_page: 20, total: 0, last_page: 1 },
  };
}

export async function getDocument(id: string) {
  const response = await apiClient.get(`/documents/${id}`);
  return response.data.data as PortalDocument;
}

export async function acknowledgeDocument(id: string, payload?: { version?: string }) {
  const response = await apiClient.post(`/documents/${id}/acknowledge`, payload ?? {});
  return response.data.data as {
    id: string;
    document_id: string;
    user_id: string;
    version: string;
    acknowledged_at: string;
  };
}

export async function createDocument(payload: {
  title: string;
  slug?: string;
  category?: string;
  status?: string;
  version?: string;
  effective_date?: string;
  content_html?: string;
  file_id?: string;
  require_acknowledgement?: boolean;
  organization_id?: string;
}) {
  const response = await apiClient.post("/documents", payload);
  return response.data.data as PortalDocument;
}

export async function updateDocument(id: string, payload: Partial<{
  title: string;
  slug: string;
  category: string;
  status: string;
  version: string;
  effective_date: string;
  content_html: string;
  file_id: string;
  require_acknowledgement: boolean;
  organization_id: string;
}>) {
  const response = await apiClient.patch(`/documents/${id}`, payload);
  return response.data.data as PortalDocument;
}

export async function listDocumentAcknowledgements(id: string, params?: { page?: number; per_page?: number; version?: string }) {
  const response = await apiClient.get(`/documents/${id}/acknowledgements`, { params });
  const payload = response.data.data as any;
  if (Array.isArray(payload)) {
    return { data: payload, meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 } };
  }
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta ?? { page: 1, per_page: 20, total: 0, last_page: 1 },
  };
}
