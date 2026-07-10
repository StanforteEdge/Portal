import type { HttpRequest } from "../auth/http-client";

export type DocumentRecord = {
  id: string;
  organization_id?: string | null;
  title: string;
  slug: string;
  category: string;
  status: string;
  version: string;
  effective_date?: string | null;
  content_html?: string | null;
  file_id?: string | null;
  require_acknowledgement: boolean;
  file?: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  acknowledgements?: Array<{
    id: string;
    acknowledged_at: string;
    ip_address?: string;
    user_agent?: string;
  }>;
};

export type DocumentAcknowledgementRecord = {
  id: string;
  document_id: string;
  user_id: string;
  acknowledged_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  };
};

export function createDocumentApi(httpRequest: HttpRequest) {
  return {
    async list(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value != null && value !== '') query.set(key, String(value));
        });
      }
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await httpRequest<any>(`/documents${suffix}`);
      return response?.data ?? response;
    },

    async get(id: string) {
      const response = await httpRequest<any>(`/documents/${id}`);
      return response?.data ?? response;
    },

    async create(dto: {
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
      const response = await httpRequest<any>('/documents', {
        method: 'POST',
        body: dto,
      });
      return response?.data ?? response;
    },

    async update(id: string, dto: {
      title?: string;
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
      const response = await httpRequest<any>(`/documents/${id}`, {
        method: 'PATCH',
        body: dto,
      });
      return response?.data ?? response;
    },

    async acknowledge(id: string, dto: { ip_address?: string; user_agent?: string }) {
      const response = await httpRequest<any>(`/documents/${id}/acknowledge`, {
        method: 'POST',
        body: dto,
      });
      return response?.data ?? response;
    },

    async listAcknowledgements(id: string, params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value != null && value !== '') query.set(key, String(value));
        });
      }
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await httpRequest<any>(`/documents/${id}/acknowledgements${suffix}`);
      return response?.data ?? response;
    }
  };
}
