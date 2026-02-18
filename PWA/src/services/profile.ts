import apiClient from "@/utils/httpClient";

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  type: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar: string | null;
  primary_organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  occupation?: string;
  bio?: string;
  address?: string;
};

export async function getMyProfile() {
  const response = await apiClient.get("/profile");
  const {
    data: { data },
  }: { data: { data: UserProfile } } = response;
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const response = await apiClient.patch("/profile", payload);
  const {
    data: { data },
  }: { data: { data: UserProfile } } = response;
  return data;
}
