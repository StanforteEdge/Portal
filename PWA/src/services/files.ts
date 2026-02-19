import apiClient from "@/utils/httpClient";

export type FileAssetRecord = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  public_url: string | null;
  usage?: {
    attached: boolean;
    request_items: number;
    pv_evidence: number;
    retirement_refs: number;
  };
};

export async function attachFileAsset(payload: {
  storage_path: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  organization_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await apiClient.post("/files", payload);
  return response.data?.data as { id: string };
}

export async function uploadFileAsset(file: File, payload?: { organization_id?: string; metadata?: Record<string, unknown> }) {
  const form = new FormData();
  form.append("file", file);
  if (payload?.organization_id) form.append("organization_id", payload.organization_id);
  if (payload?.metadata) form.append("metadata_json", JSON.stringify(payload.metadata));
  const response = await apiClient.post("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const row = response.data?.data ?? {};
  return {
    id: String(row.id),
    file_name: String(row.file_name ?? row.fileName ?? file.name),
    mime_type: (row.mime_type ?? row.mimeType ?? file.type ?? null) as string | null,
    file_size:
      row.file_size !== undefined && row.file_size !== null
        ? Number(row.file_size)
        : row.fileSize !== undefined && row.fileSize !== null
          ? Number(row.fileSize)
          : file.size || null,
    storage_path: String(row.storage_path ?? row.storagePath ?? ""),
    public_url: (row.public_url ?? row.publicUrl ?? null) as string | null,
  } as FileAssetRecord;
}

export async function listFileAssets(params?: {
  search?: string;
  include_usage?: boolean;
  page?: number;
  per_page?: number;
  uploaded_by?: string;
  file_type?: "images" | "videos" | "documents";
  attached?: boolean;
}) {
  const response = await apiClient.get("/files", {
    params: {
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.include_usage ? { include_usage: "true" } : {}),
      ...(params?.page ? { page: params.page } : {}),
      ...(params?.per_page ? { per_page: params.per_page } : {}),
      ...(params?.uploaded_by ? { uploaded_by: params.uploaded_by } : {}),
      ...(params?.file_type ? { file_type: params.file_type } : {}),
      ...(params?.attached !== undefined ? { attached: String(params.attached) } : {}),
    },
  });
  const rows = (response.data?.data ?? []) as Array<any>;
  return rows.map(
    (row) =>
      ({
        id: String(row.id),
        file_name: String(row.file_name ?? row.fileName ?? ""),
        mime_type: (row.mime_type ?? row.mimeType ?? null) as string | null,
        file_size:
          row.file_size !== undefined && row.file_size !== null
            ? Number(row.file_size)
            : row.fileSize !== undefined && row.fileSize !== null
              ? Number(row.fileSize)
              : null,
        storage_path: String(row.storage_path ?? row.storagePath ?? ""),
        public_url: (row.public_url ?? row.publicUrl ?? null) as string | null,
        usage: row.usage
          ? {
              attached: Boolean(row.usage.attached),
              request_items: Number(row.usage.request_items ?? 0),
              pv_evidence: Number(row.usage.pv_evidence ?? 0),
              retirement_refs: Number(row.usage.retirement_refs ?? 0),
            }
          : undefined,
      }) satisfies FileAssetRecord
  );
}

export async function getFileUsage(fileId: string) {
  const response = await apiClient.get(`/files/${fileId}/usage`);
  return response.data?.data as any;
}

export async function deleteFileAsset(fileId: string) {
  const response = await apiClient.delete(`/files/${fileId}`);
  return response.data?.data as { success: boolean };
}
