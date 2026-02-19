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
  address?: string | null;
  avatar: string | null;
  primary_organization_id: string | null;
  onboarding_progress?: {
    status?: string;
    currentStep?: string;
    current_step?: string;
  } | null;
  employee_profile?: {
    employee_code?: string | null;
    job_title?: string | null;
    job_description?: string | null;
    employment_type?: string | null;
    employment_status?: string | null;
    work_mode?: string | null;
    hire_date?: string | null;
    confirmation_date?: string | null;
    manager?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  } | null;
  teams?: Array<{ id: string; name: string; type: string; role: string }>;
  projects?: Array<{ id: string; name: string; type: string; role: string }>;
  created_at: string;
  updated_at: string;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
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
