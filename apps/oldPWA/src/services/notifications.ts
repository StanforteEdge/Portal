import apiClient from "@/utils/httpClient";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  status: "read" | "unread";
  created_at: string;
  data?: Record<string, unknown> | null;
};

export async function listNotifications(status?: "read" | "unread") {
  const response = await apiClient.get("/notifications", {
    params: status ? { status } : {},
  });
  return (response.data?.data ?? []) as NotificationItem[];
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get("/notifications/unread-count");
  return Number(response.data?.data ?? 0);
}

export async function markNotificationRead(id: string) {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.put("/notifications/mark-all-read");
}
