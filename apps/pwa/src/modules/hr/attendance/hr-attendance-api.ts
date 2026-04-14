// apps/pwa/src/modules/hr/attendance/hr-attendance-api.ts
import { httpRequest } from "@/shared/lib/core";
import type { AttendanceDaily, AttendanceEntry } from "./attendance-api";

export type { AttendanceDaily, AttendanceEntry };

export type StaffDailyRow = {
  user_id: string;
  user_name: string;
  email: string;
  work_date: string;
  status: string;
  attendance_mode: string | null;
  first_in_at: string | null;
  last_out_at: string | null;
  worked_minutes: number;
  late_minutes: number;
};

export type AttendanceTodayStats = {
  total_staff: number;
  clocked_in: number;
  late: number;
  absent: number;
};

export type AdminCorrectionRow = {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  request_type: string;
  status: string;
  work_date: string;
  reason: string;
  proposed_at: string | null;
  proposed_mode: string | null;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
};

export type StaffAttendanceDetail = {
  daily: AttendanceDaily[];
  entries: AttendanceEntry[];
};

export type HrAttendanceListResponse = {
  data: StaffDailyRow[];
  total: number;
};

export type HrCorrectionsResponse = {
  data: AdminCorrectionRow[];
};

export async function getHrAttendanceStats(date: string): Promise<AttendanceTodayStats> {
  return httpRequest<AttendanceTodayStats>(`/hr/attendance/stats?date=${date}`);
}

export async function listHrAttendance(params: {
  from: string;
  to: string;
  user_id?: string;
  org_id?: string;
  status?: string;
}): Promise<HrAttendanceListResponse> {
  const query = new URLSearchParams();
  query.set("from", params.from);
  query.set("to", params.to);
  if (params.user_id) query.set("user_id", params.user_id);
  if (params.org_id) query.set("org_id", params.org_id);
  if (params.status) query.set("status", params.status);
  return httpRequest<HrAttendanceListResponse>(`/hr/attendance/staff?${query.toString()}`);
}

export async function getStaffAttendance(
  userId: string,
  params: { from: string; to: string },
): Promise<StaffAttendanceDetail> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  return httpRequest<StaffAttendanceDetail>(
    `/hr/attendance/staff/${userId}?${query.toString()}`,
  );
}

export async function listHrCorrections(params?: {
  status?: string;
}): Promise<HrCorrectionsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<HrCorrectionsResponse>(`/hr/attendance/corrections${suffix}`);
}

export async function reviewCorrection(
  id: string,
  payload: { status: "approved" | "rejected"; review_notes?: string },
): Promise<void> {
  return httpRequest<void>(`/hr/attendance/corrections/${id}/review`, {
    method: "PATCH",
    body: payload,
  });
}
