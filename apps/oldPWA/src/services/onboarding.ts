import apiClient from "@/utils/httpClient";

export type OnboardingSnapshot = {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone?: string | null;
    address?: string | null;
    nationality?: string | null;
    email: string;
    status: string;
  };
  profile: Record<string, unknown> | null;
  emergency_contacts?: Array<{
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  }>;
  progress: {
    status: string;
    currentStep?: string;
    current_step?: string;
    stepsJson?: Record<string, unknown>;
    steps_json?: Record<string, unknown>;
  };
  forms: Array<{ id: string; name: string; module: string }>;
  submissions: Array<{ id: string; formId?: string; form_id?: string; status: string; submittedAt?: string }>;
  completion: {
    forms_total: number;
    forms_submitted: number;
  };
};

export async function getMyOnboarding() {
  const response = await apiClient.get("/onboarding/me");
  return response.data.data as OnboardingSnapshot;
}

export async function updateMyOnboarding(payload: {
  action: "complete_step" | "save_profile" | "save_contacts";
  step_key?: string;
  payload?: Record<string, unknown>;
}) {
  const response = await apiClient.patch("/onboarding/me", payload);
  return response.data.data as OnboardingSnapshot;
}

export async function submitOnboardingForm(payload: {
  form_id: string;
  payload?: Record<string, unknown>;
}) {
  const response = await apiClient.post("/onboarding/me/forms", payload);
  return response.data.data as {
    submission_id: string;
    submission_number: string;
    status: string;
  };
}
