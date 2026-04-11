import { httpRequest } from "@/shared/lib/core";

export type WorkspaceProfile = {
  id: string;
  username: string;
  email: string;
  type: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address?: string | null;
  organizations?: Array<{ id: string; name: string; code: string; is_primary?: boolean }>;
  groups?: Array<{ id: string; name: string; type: string; role: string; is_primary?: boolean }>;
  employee_profile?: {
    employee_code?: string | null;
    job_title?: string | null;
    employment_status?: string | null;
    manager?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  } | null;
  teams?: Array<{ id: string; name: string; type: string; role: string }>;
  projects?: Array<{ id: string; name: string; type: string; role: string }>;
  onboarding_progress?: {
    status?: string;
  } | null;
};

export type WorkspaceNotification = {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  status: "read" | "unread";
  createdAt: string;
  updatedAt?: string;
  readAt?: string | null;
  archivedAt?: string | null;
  sentVia?: string[];
  notifiableType?: string | null;
  notifiableId?: string | null;
  data?: Record<string, unknown> | null;
};

export async function getWorkspaceProfile() {
  return httpRequest<WorkspaceProfile>("/profile");
}

export async function updateWorkspaceProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  occupation?: string;
  bio?: string;
  address?: string;
}) {
  return httpRequest<WorkspaceProfile>("/profile", {
    method: "PATCH",
    body: payload,
  });
}

export async function changeWorkspacePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  return httpRequest("/auth/change-password", {
    method: "POST",
    body: payload,
  });
}

export async function listWorkspaceNotifications(status?: "read" | "unread") {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<WorkspaceNotification[]>(`/notifications${suffix}`);
}

export async function getWorkspaceUnreadNotificationCount() {
  return httpRequest<number>("/notifications/unread-count");
}

export async function markWorkspaceNotificationRead(id: string) {
  return httpRequest(`/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllWorkspaceNotificationsRead() {
  return httpRequest("/notifications/mark-all-read", {
    method: "PUT",
  });
}
