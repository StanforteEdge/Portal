import { httpRequest } from "@/lib/core";

export type FileAssetRecord = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  public_url: string | null;
};

export async function uploadFileAsset(
  file: File,
  payload?: { organization_id?: string; metadata?: Record<string, unknown> }
) {
  const form = new FormData();
  form.append("file", file);
  if (payload?.organization_id) form.append("organization_id", payload.organization_id);
  if (payload?.metadata) form.append("metadata_json", JSON.stringify(payload.metadata));

  return httpRequest<FileAssetRecord>("/files/upload", {
    method: "POST",
    body: form,
  });
}
