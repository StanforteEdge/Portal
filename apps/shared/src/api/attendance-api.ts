// apps/shared/src/api/attendance-api.ts
import type { HttpRequest } from "../auth/http-client";

export type AttendanceEntry = {
  id: string;
  user_id: string;
  clock_time: string;
  clock_type: "in" | "out";
  mode: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  location_name?: string;
  note?: string;
  metadata?: any;
};

export type AttendanceDaily = {
  id: string;
  user_id: string;
  work_date: string;
  status: string;
  attendance_mode: string | null;
  expected_mode: string | null;
  first_in_at: string | null;
  last_out_at: string | null;
  worked_minutes: number;
  late_minutes: number;
};

export type StaffDailyRow = AttendanceDaily & {
  user_name: string;
  email: string;
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

export type OfficeLocation = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  organizations: Array<{ id: string; name: string; is_primary?: boolean }>;
};

export function normalizeAttendanceRecord(row: any): StaffDailyRow {
  const profile = row.profile || row.user?.employee_profile || row.user;
  return {
    id: String(row.id || `${row.user_id}-${row.work_date}`),
    user_id: String(row.user_id),
    user_name: profile 
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username || "Unknown"
      : "Unknown",
    email: profile?.email || "-",
    work_date: row.work_date,
    status: row.status,
    attendance_mode: row.attendance_mode,
    expected_mode: row.expected_mode,
    first_in_at: row.first_in_at,
    last_out_at: row.last_out_at,
    worked_minutes: Number(row.worked_minutes || 0),
    late_minutes: Number(row.late_minutes || 0),
  };
}

export function createAttendanceApi(httpRequest: HttpRequest) {
  return {
    async getStats(date: string): Promise<AttendanceTodayStats> {
      const res = await httpRequest<any>(`/hr/attendance/summary?from=${date}&to=${date}`);
      const inner = res?.data ?? res;
      const stats = inner?.by_status || {};
      return {
        total_staff: (stats.present || 0) + (stats.late || 0) + (stats.absent || 0) + (stats.excused || 0),
        clocked_in: (stats.present || 0) + (stats.late || 0),
        late: stats.late || 0,
        absent: stats.absent || 0,
      };
    },

    async getTrend(from: string, to: string): Promise<Array<{ date: string; present: number; late: number; absent: number }>> {
      const res = await httpRequest<any>(`/hr/attendance/summary?from=${from}&to=${to}`);
      const inner = res?.data ?? res;
      return inner?.daily || [];
    },

    async listRecords(params: { from: string; to: string; user_id?: string; org_id?: string; team_id?: string; status?: string }) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, String(v)); });
      const res = await httpRequest<any>(`/hr/attendance/records?${query.toString()}`);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return data.map(normalizeAttendanceRecord);
    },

    async listCorrections(params?: { status?: string }) {
      const query = params?.status ? `?status=${params.status}` : "";
      const res = await httpRequest<any>(`/hr/attendance/corrections${query}`);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return data.map((c: any) => ({
        ...c,
        user_name: c.profile ? `${c.profile.first_name} ${c.profile.last_name}` : "Unknown",
        email: c.profile?.email || "-"
      })) as AdminCorrectionRow[];
    },

    async reviewCorrection(id: string, action: "approve" | "reject", notes?: string) {
      return httpRequest<void>(`/hr/attendance/corrections/${id}/${action}`, {
        method: "POST",
        body: { review_notes: notes },
      });
    },

    async clockAction(action: "clock-in" | "clock-out", payload: Partial<AttendanceEntry>) {
      return httpRequest<AttendanceEntry>(`/hr/attendance/${action}`, {
        method: "POST",
        body: payload,
      });
    },

    async listOfficeLocations(params?: { is_active?: boolean }): Promise<{ data: OfficeLocation[] }> {
      const query = params?.is_active !== undefined ? `?is_active=${params.is_active}` : "";
      const res = await httpRequest<{ data: OfficeLocation[] }>(`/hr/attendance/office-locations${query}`);
      return res;
    },

    async saveOfficeLocation(data: any, id?: string) {
      const method = id ? "PATCH" : "POST";
      const url = id ? `/hr/attendance/office-locations/${id}` : "/hr/attendance/office-locations";
      return httpRequest<OfficeLocation>(url, {
        method,
        body: data,
      });
    },

    async getDailyRecord(userId: string, workDate: string) {
      const res = await httpRequest<any>(`/hr/attendance/records/${userId}/${workDate}`);
      return res;
    }
  };
}
