import apiClient from "@/utils/httpClient";

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
