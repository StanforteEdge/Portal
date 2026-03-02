import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createPolicy, listPolicies, type PolicyRecord, updatePolicy } from "@/services/policies";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listTeams, type TeamOption } from "@/services/teams";
import { listUsers, type UserListItem } from "@/services/users";
import { listRequestTypes, type RequestTypeOption } from "@/services/requests";

type ScopeType = "organization" | "team" | "staff_type" | "user";
type SettingsTab = "attendance" | "leave";

type AttendanceConfig = {
  start_time: string;
  end_time: string;
  grace_minutes: string;
  max_future_minutes: string;
  max_past_days: string;
  earliest_clock_in_minutes_before_start: string;
  latest_clock_out_minutes_after_end: string;
};

type LeaveEntitlementRow = { leave_type_key: string; days: string };

type OverrideForm = {
  scope_type: ScopeType;
  scope_id: string;
  priority: string;
};

const defaultAttendance: AttendanceConfig = {
  start_time: "09:00",
  end_time: "17:00",
  grace_minutes: "15",
  max_future_minutes: "5",
  max_past_days: "7",
  earliest_clock_in_minutes_before_start: "240",
  latest_clock_out_minutes_after_end: "720",
};

const defaultLeave: LeaveEntitlementRow[] = [
  { leave_type_key: "annual_leave", days: "20" },
  { leave_type_key: "sick_leave", days: "10" },
  { leave_type_key: "casual_leave", days: "5" },
];

const scopeTypes: Array<{ value: ScopeType; label: string }> = [
  { value: "organization", label: "Organization" },
  { value: "team", label: "Team" },
  { value: "staff_type", label: "Staff Type" },
  { value: "user", label: "User" },
];

const staffTypeOptions = [
  { value: "full_time", label: "Full Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "consultant", label: "Consultant" },
];

const defaultOverrideForm: OverrideForm = {
  scope_type: "organization",
  scope_id: "",
  priority: "100",
};

function mapAttendanceConfig(config: unknown): AttendanceConfig {
  const raw = config && typeof config === "object" ? (config as Record<string, unknown>) : {};
  return {
    start_time: String(raw.start_time ?? defaultAttendance.start_time),
    end_time: String(raw.end_time ?? defaultAttendance.end_time),
    grace_minutes: String(raw.grace_minutes ?? defaultAttendance.grace_minutes),
    max_future_minutes: String(raw.max_future_minutes ?? defaultAttendance.max_future_minutes),
    max_past_days: String(raw.max_past_days ?? defaultAttendance.max_past_days),
    earliest_clock_in_minutes_before_start: String(
      raw.earliest_clock_in_minutes_before_start ?? defaultAttendance.earliest_clock_in_minutes_before_start
    ),
    latest_clock_out_minutes_after_end: String(
      raw.latest_clock_out_minutes_after_end ?? defaultAttendance.latest_clock_out_minutes_after_end
    ),
  };
}

function mapLeaveRows(config: unknown): LeaveEntitlementRow[] {
  const raw = config && typeof config === "object" ? (config as Record<string, unknown>) : {};
  const rows = Object.entries(raw).map(([leaveType, days]) => ({
    leave_type_key: leaveType,
    days: String(Number(days ?? 0)),
  }));
  return rows.length > 0 ? rows : defaultLeave;
}

function HrSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("attendance");
  const [attendancePolicy, setAttendancePolicy] = useState<PolicyRecord | null>(null);
  const [leavePolicy, setLeavePolicy] = useState<PolicyRecord | null>(null);
  const [leaveRequestTypePolicy, setLeaveRequestTypePolicy] = useState<PolicyRecord | null>(null);
  const [attendanceOverrides, setAttendanceOverrides] = useState<PolicyRecord[]>([]);
  const [leaveOverrides, setLeaveOverrides] = useState<PolicyRecord[]>([]);
  const [leaveRequestTypes, setLeaveRequestTypes] = useState<RequestTypeOption[]>([]);
  const [defaultLeaveRequestTypeId, setDefaultLeaveRequestTypeId] = useState("");

  const [attendance, setAttendance] = useState<AttendanceConfig>(defaultAttendance);
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlementRow[]>(defaultLeave);

  const [attendanceOverrideForm, setAttendanceOverrideForm] = useState<OverrideForm>(defaultOverrideForm);
  const [leaveOverrideForm, setLeaveOverrideForm] = useState<OverrideForm>(defaultOverrideForm);
  const [attendanceOverrideConfig, setAttendanceOverrideConfig] = useState<AttendanceConfig>(defaultAttendance);
  const [leaveOverrideRows, setLeaveOverrideRows] = useState<LeaveEntitlementRow[]>(defaultLeave);

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingLeave, setSavingLeave] = useState(false);
  const [savingAttendanceOverride, setSavingAttendanceOverride] = useState(false);
  const [savingLeaveOverride, setSavingLeaveOverride] = useState(false);
  const [savingLeaveRequestType, setSavingLeaveRequestType] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const hasAnyLeaveType = useMemo(
    () => leaveEntitlements.some((row) => row.leave_type_key.trim().length > 0),
    [leaveEntitlements]
  );

  const load = async () => {
    try {
      setLoading(true);
      const [attendanceGlobalRes, leaveGlobalRes, leaveRequestTypeRes, attendanceOverridesRes, leaveOverridesRes] = await Promise.all([
        listPolicies({ module: "attendance", policy_key: "schedule", scope_type: "global", per_page: 1 }),
        listPolicies({ module: "leave", policy_key: "leave_entitlements", scope_type: "global", per_page: 1 }),
        listPolicies({ module: "leave", policy_key: "leave_request_type", scope_type: "global", per_page: 1 }),
        listPolicies({ module: "attendance", policy_key: "schedule", is_active: true, per_page: 200 }),
        listPolicies({ module: "leave", policy_key: "leave_entitlements", is_active: true, per_page: 200 }),
      ]);

      const attendanceGlobal = attendanceGlobalRes.data?.[0] ?? null;
      const leaveGlobal = leaveGlobalRes.data?.[0] ?? null;
      const leaveRequestType = leaveRequestTypeRes.data?.[0] ?? null;

      setAttendancePolicy(attendanceGlobal);
      setLeavePolicy(leaveGlobal);
      setLeaveRequestTypePolicy(leaveRequestType);
      setAttendance(mapAttendanceConfig(attendanceGlobal?.config_json));
      setLeaveEntitlements(mapLeaveRows(leaveGlobal?.config_json));
      const requestTypeId = String(
        ((leaveRequestType?.config_json as Record<string, unknown> | null)?.request_type_id as string | undefined) ?? ""
      );
      setDefaultLeaveRequestTypeId(requestTypeId);

      setAttendanceOverrides(
        (attendanceOverridesRes.data ?? []).filter((row) => row.scope_type !== "global")
      );
      setLeaveOverrides((leaveOverridesRes.data ?? []).filter((row) => row.scope_type !== "global"));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load HR settings." });
    } finally {
      setLoading(false);
    }
  };

  const loadScopeOptions = async () => {
    try {
      const [orgRows, teamRows, userRows, requestTypeRows] = await Promise.all([
        listOrganizations({ is_active: true }),
        listTeams({ active_only: true, group_type: "team" }),
        listUsers({ page: 1, per_page: 300 }),
        listRequestTypes().catch(() => []),
      ]);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setUsers(userRows.data ?? []);
      const leaveTypes = (requestTypeRows || []).filter((type) => {
        const categoryKey = String(type.category_key ?? "").toLowerCase();
        const typeName = String(type.name ?? "").toLowerCase();
        return categoryKey.includes("leave") || typeName.includes("leave");
      });
      setLeaveRequestTypes(leaveTypes);
    } catch {
      // do not block settings render on options fetch failure
    }
  };

  useEffect(() => {
    void Promise.all([load(), loadScopeOptions()]);
  }, []);

  const saveAttendance = async () => {
    const toNum = (value: string) => Number(value || 0);
    const payloadConfig = {
      start_time: attendance.start_time,
      end_time: attendance.end_time,
      grace_minutes: toNum(attendance.grace_minutes),
      max_future_minutes: toNum(attendance.max_future_minutes),
      max_past_days: toNum(attendance.max_past_days),
      earliest_clock_in_minutes_before_start: toNum(attendance.earliest_clock_in_minutes_before_start),
      latest_clock_out_minutes_after_end: toNum(attendance.latest_clock_out_minutes_after_end),
    };

    if (!payloadConfig.start_time || !payloadConfig.end_time) {
      setNotice({ tone: "warning", message: "Start time and end time are required." });
      return;
    }

    try {
      setSavingAttendance(true);
      const payload = {
        module: "attendance",
        policy_key: "schedule",
        scope_type: "global",
        priority: 100,
        is_active: true,
        config_json: payloadConfig,
      };
      if (attendancePolicy?.id) await updatePolicy(attendancePolicy.id, payload);
      else await createPolicy(payload);
      setNotice({ tone: "success", message: "Attendance policy saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save attendance policy." });
    } finally {
      setSavingAttendance(false);
    }
  };

  const saveLeave = async () => {
    if (!hasAnyLeaveType) {
      setNotice({ tone: "warning", message: "Add at least one leave type." });
      return;
    }

    const config: Record<string, number> = {};
    for (const row of leaveEntitlements) {
      const key = row.leave_type_key.trim().toLowerCase();
      if (!key) {
        setNotice({ tone: "warning", message: "Leave type key is required." });
        return;
      }
      const days = Number(row.days || 0);
      if (Number.isNaN(days) || days < 0) {
        setNotice({ tone: "warning", message: `Invalid days for ${key}.` });
        return;
      }
      config[key] = days;
    }

    try {
      setSavingLeave(true);
      const payload = {
        module: "leave",
        policy_key: "leave_entitlements",
        scope_type: "global",
        priority: 100,
        is_active: true,
        config_json: config,
      };
      if (leavePolicy?.id) await updatePolicy(leavePolicy.id, payload);
      else await createPolicy(payload);
      setNotice({ tone: "success", message: "Leave entitlement policy saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save leave policy." });
    } finally {
      setSavingLeave(false);
    }
  };

  const saveLeaveRequestType = async () => {
    if (!defaultLeaveRequestTypeId) {
      setNotice({ tone: "warning", message: "Select a leave request type." });
      return;
    }
    try {
      setSavingLeaveRequestType(true);
      const payload = {
        module: "leave",
        policy_key: "leave_request_type",
        scope_type: "global",
        priority: 100,
        is_active: true,
        config_json: {
          request_type_id: defaultLeaveRequestTypeId,
        },
      };
      if (leaveRequestTypePolicy?.id) await updatePolicy(leaveRequestTypePolicy.id, payload);
      else await createPolicy(payload);
      setNotice({ tone: "success", message: "Default leave request type saved." });
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to save leave request type setting.",
      });
    } finally {
      setSavingLeaveRequestType(false);
    }
  };

  const scopeOptionsFor = (scopeType: ScopeType) => {
    if (scopeType === "organization") {
      return organizations.map((row) => ({ value: row.id, label: `${row.name} (${row.code})` }));
    }
    if (scopeType === "team") {
      return teams.map((row) => ({ value: row.id, label: row.name }));
    }
    if (scopeType === "staff_type") {
      return staffTypeOptions;
    }
    return users.map((row) => ({
      value: row.id,
      label: `${(row.firstName || "").trim()} ${(row.lastName || "").trim()}`.trim() || row.email,
    }));
  };

  const scopeLabel = (scopeType: string, scopeId: string | null) => {
    if (!scopeId) return "-";
    if (scopeType === "organization") {
      return organizations.find((row) => row.id === scopeId)?.name ?? scopeId;
    }
    if (scopeType === "team") {
      return teams.find((row) => row.id === scopeId)?.name ?? scopeId;
    }
    if (scopeType === "staff_type") {
      return staffTypeOptions.find((row) => row.value === scopeId)?.label ?? scopeId;
    }
    if (scopeType === "user") {
      const match = users.find((row) => row.id === scopeId);
      return match ? `${match.firstName || ""} ${match.lastName || ""}`.trim() || match.email : scopeId;
    }
    return scopeId;
  };

  const saveAttendanceOverride = async () => {
    if (!attendanceOverrideForm.scope_id) {
      setNotice({ tone: "warning", message: "Select a scope target for attendance override." });
      return;
    }

    const config = {
      start_time: attendanceOverrideConfig.start_time,
      end_time: attendanceOverrideConfig.end_time,
      grace_minutes: Number(attendanceOverrideConfig.grace_minutes || 0),
      max_future_minutes: Number(attendanceOverrideConfig.max_future_minutes || 0),
      max_past_days: Number(attendanceOverrideConfig.max_past_days || 0),
      earliest_clock_in_minutes_before_start: Number(attendanceOverrideConfig.earliest_clock_in_minutes_before_start || 0),
      latest_clock_out_minutes_after_end: Number(attendanceOverrideConfig.latest_clock_out_minutes_after_end || 0),
    };

    try {
      setSavingAttendanceOverride(true);
      await createPolicy({
        module: "attendance",
        policy_key: "schedule",
        scope_type: attendanceOverrideForm.scope_type,
        scope_id: attendanceOverrideForm.scope_id,
        priority: Number(attendanceOverrideForm.priority || 100),
        config_json: config,
        is_active: true,
      });
      setAttendanceOverrideForm(defaultOverrideForm);
      setAttendanceOverrideConfig(defaultAttendance);
      setNotice({ tone: "success", message: "Attendance override added." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to add attendance override." });
    } finally {
      setSavingAttendanceOverride(false);
    }
  };

  const saveLeaveOverride = async () => {
    if (!leaveOverrideForm.scope_id) {
      setNotice({ tone: "warning", message: "Select a scope target for leave override." });
      return;
    }

    const config: Record<string, number> = {};
    for (const row of leaveOverrideRows) {
      const key = row.leave_type_key.trim().toLowerCase();
      if (!key) continue;
      const days = Number(row.days || 0);
      if (!Number.isNaN(days) && days >= 0) config[key] = days;
    }

    if (!Object.keys(config).length) {
      setNotice({ tone: "warning", message: "Add at least one leave type for override." });
      return;
    }

    try {
      setSavingLeaveOverride(true);
      await createPolicy({
        module: "leave",
        policy_key: "leave_entitlements",
        scope_type: leaveOverrideForm.scope_type,
        scope_id: leaveOverrideForm.scope_id,
        priority: Number(leaveOverrideForm.priority || 100),
        config_json: config,
        is_active: true,
      });
      setLeaveOverrideForm(defaultOverrideForm);
      setLeaveOverrideRows(defaultLeave);
      setNotice({ tone: "success", message: "Leave override added." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to add leave override." });
    } finally {
      setSavingLeaveOverride(false);
    }
  };

  const deactivateOverride = async (policyId: string) => {
    try {
      await updatePolicy(policyId, { is_active: false });
      setNotice({ tone: "success", message: "Override deactivated." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to deactivate override." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">HR Settings</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="mt-5 intro-y">
        <div className="box p-2">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "attendance" ? "primary" : "outline-secondary"}
              onClick={() => setActiveTab("attendance")}
            >
              <Lucide icon="Clock3" className="w-4 h-4 mr-1" />
              Attendance Settings
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/app/hr/settings/leave")}
            >
              <Lucide icon="BookOpen" className="w-4 h-4 mr-1" />
              Leave Settings
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "attendance" ? (
        <>
          <div className="box p-5 mt-5">
            <div className="flex items-center">
              <h3 className="mr-auto text-base font-medium">Attendance Policy</h3>
              <Button variant="primary" onClick={() => void saveAttendance()} disabled={savingAttendance}>
                <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
                {savingAttendance ? "Saving..." : "Save Attendance Policy"}
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-2">Global policy for all staff unless an override applies.</div>
            <div className="grid grid-cols-12 gap-3 mt-4">
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Start Time</FormLabel>
                <FormInput type="time" value={attendance.start_time} onChange={(e) => setAttendance((p) => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>End Time</FormLabel>
                <FormInput type="time" value={attendance.end_time} onChange={(e) => setAttendance((p) => ({ ...p, end_time: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-2">
                <FormLabel>Grace (mins)</FormLabel>
                <FormInput type="number" min={0} value={attendance.grace_minutes} onChange={(e) => setAttendance((p) => ({ ...p, grace_minutes: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-2">
                <FormLabel>Future (mins)</FormLabel>
                <FormInput type="number" min={0} value={attendance.max_future_minutes} onChange={(e) => setAttendance((p) => ({ ...p, max_future_minutes: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-2">
                <FormLabel>Backdate (days)</FormLabel>
                <FormInput type="number" min={0} value={attendance.max_past_days} onChange={(e) => setAttendance((p) => ({ ...p, max_past_days: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Earliest Clock-in (mins before start)</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  value={attendance.earliest_clock_in_minutes_before_start}
                  onChange={(e) => setAttendance((p) => ({ ...p, earliest_clock_in_minutes_before_start: e.target.value }))}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Latest Clock-out (mins after end)</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  value={attendance.latest_clock_out_minutes_after_end}
                  onChange={(e) => setAttendance((p) => ({ ...p, latest_clock_out_minutes_after_end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="box p-5 mt-5 mb-10">
            <div className="flex items-center">
              <h3 className="mr-auto text-base font-medium">Attendance Overrides</h3>
              <Button variant="primary" onClick={() => void saveAttendanceOverride()} disabled={savingAttendanceOverride}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                {savingAttendanceOverride ? "Adding..." : "Add Override"}
              </Button>
            </div>
            <div className="grid grid-cols-12 gap-3 mt-4">
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Scope</FormLabel>
                <FormSelect
                  value={attendanceOverrideForm.scope_type}
                  onChange={(e) =>
                    setAttendanceOverrideForm((prev) => ({
                      ...prev,
                      scope_type: e.target.value as ScopeType,
                      scope_id: "",
                    }))
                  }
                >
                  {scopeTypes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-5">
                <FormLabel>Target</FormLabel>
                <FormSelect value={attendanceOverrideForm.scope_id} onChange={(e) => setAttendanceOverrideForm((prev) => ({ ...prev, scope_id: e.target.value }))}>
                  <option value="">Select target</option>
                  {scopeOptionsFor(attendanceOverrideForm.scope_type).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-2">
                <FormLabel>Priority</FormLabel>
                <FormInput type="number" min={0} value={attendanceOverrideForm.priority} onChange={(e) => setAttendanceOverrideForm((prev) => ({ ...prev, priority: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 mt-3">
              <div className="col-span-12 md:col-span-2"><FormInput type="time" value={attendanceOverrideConfig.start_time} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, start_time: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-2"><FormInput type="time" value={attendanceOverrideConfig.end_time} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, end_time: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-2"><FormInput type="number" min={0} placeholder="Grace" value={attendanceOverrideConfig.grace_minutes} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, grace_minutes: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-2"><FormInput type="number" min={0} placeholder="Future" value={attendanceOverrideConfig.max_future_minutes} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, max_future_minutes: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-2"><FormInput type="number" min={0} placeholder="Backdate" value={attendanceOverrideConfig.max_past_days} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, max_past_days: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-1"><FormInput type="number" min={0} placeholder="Early" value={attendanceOverrideConfig.earliest_clock_in_minutes_before_start} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, earliest_clock_in_minutes_before_start: e.target.value }))} /></div>
              <div className="col-span-12 md:col-span-1"><FormInput type="number" min={0} placeholder="Late" value={attendanceOverrideConfig.latest_clock_out_minutes_after_end} onChange={(e) => setAttendanceOverrideConfig((p) => ({ ...p, latest_clock_out_minutes_after_end: e.target.value }))} /></div>
            </div>

            <Table className="mt-4">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Scope</Table.Th>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {attendanceOverrides.length ? attendanceOverrides.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.scope_type}</Table.Td>
                    <Table.Td>{scopeLabel(row.scope_type, row.scope_id)}</Table.Td>
                    <Table.Td>{row.priority}</Table.Td>
                    <Table.Td>
                      <Button variant="outline-danger" size="sm" onClick={() => void deactivateOverride(row.id)}>
                        <Lucide icon="Trash2" className="w-3 h-3 mr-1" /> Disable
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )) : (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-slate-500">No active attendance overrides.</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
        </>
      ) : null}

      {activeTab === "leave" ? (
        <>
          <div className="box p-5 mt-5">
            <div className="flex items-center">
              <h3 className="mr-auto text-base font-medium">Leave Request Type</h3>
              <Button variant="primary" onClick={() => void saveLeaveRequestType()} disabled={savingLeaveRequestType}>
                <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
                {savingLeaveRequestType ? "Saving..." : "Save Default"}
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              This controls which leave request type is auto-selected on the staff leave request page.
            </div>
            <div className="mt-4 max-w-xl">
              <FormLabel>Default Leave Request Type</FormLabel>
              <FormSelect value={defaultLeaveRequestTypeId} onChange={(e) => setDefaultLeaveRequestTypeId(e.target.value)}>
                <option value="">Select leave request type</option>
                {leaveRequestTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">HR Leave Request Types</div>
                <Link to="/app/hr/settings/request-types/new">
                  <Button variant="outline-primary">
                    <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                    Create Request Type
                  </Button>
                </Link>
              </div>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {leaveRequestTypes.map((type) => (
                    <Table.Tr key={type.id}>
                      <Table.Td>{type.name}</Table.Td>
                      <Table.Td>{type.code_prefix}</Table.Td>
                      <Table.Td>{type.is_active ? "Active" : "Inactive"}</Table.Td>
                      <Table.Td>
                        <Link to={`/app/hr/settings/request-types/${type.id}`}>
                          <Button variant="outline-secondary" size="sm">
                            <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {leaveRequestTypes.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4} className="text-slate-500">
                        No HR leave request types found.
                      </Table.Td>
                    </Table.Tr>
                  ) : null}
                </Table.Tbody>
              </Table>
            </div>
          </div>

          <div className="box p-5 mt-5">
            <div className="flex items-center">
              <h3 className="mr-auto text-base font-medium">Leave Entitlements</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline-primary" onClick={() => setLeaveEntitlements((prev) => [...prev, { leave_type_key: "", days: "0" }])}>
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Leave Type
                </Button>
                <Button variant="primary" onClick={() => void saveLeave()} disabled={savingLeave}>
                  <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
                  {savingLeave ? "Saving..." : "Save Leave Entitlements"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {leaveEntitlements.map((row, index) => (
                <div key={`${row.leave_type_key}-${index}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <FormInput
                      value={row.leave_type_key}
                      onChange={(e) =>
                        setLeaveEntitlements((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, leave_type_key: e.target.value } : item))
                        )
                      }
                      placeholder="e.g. annual_leave"
                    />
                  </div>
                  <div className="col-span-3">
                    <FormInput
                      type="number"
                      min={0}
                      step="0.5"
                      value={row.days}
                      onChange={(e) =>
                        setLeaveEntitlements((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, days: e.target.value } : item))
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline-danger"
                      className="w-full"
                      onClick={() => setLeaveEntitlements((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))}
                    >
                      <Lucide icon="XCircle" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="box p-5 mt-5 mb-10">
            <div className="flex items-center">
              <h3 className="mr-auto text-base font-medium">Leave Overrides</h3>
              <Button variant="primary" onClick={() => void saveLeaveOverride()} disabled={savingLeaveOverride}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                {savingLeaveOverride ? "Adding..." : "Add Override"}
              </Button>
            </div>
            <div className="grid grid-cols-12 gap-3 mt-4">
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Scope</FormLabel>
                <FormSelect
                  value={leaveOverrideForm.scope_type}
                  onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, scope_type: e.target.value as ScopeType, scope_id: "" }))}
                >
                  {scopeTypes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-5">
                <FormLabel>Target</FormLabel>
                <FormSelect value={leaveOverrideForm.scope_id} onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, scope_id: e.target.value }))}>
                  <option value="">Select target</option>
                  {scopeOptionsFor(leaveOverrideForm.scope_type).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-2">
                <FormLabel>Priority</FormLabel>
                <FormInput type="number" min={0} value={leaveOverrideForm.priority} onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, priority: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {leaveOverrideRows.map((row, index) => (
                <div key={`ovr-${row.leave_type_key}-${index}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <FormInput
                      value={row.leave_type_key}
                      onChange={(e) =>
                        setLeaveOverrideRows((prev) => prev.map((item, i) => (i === index ? { ...item, leave_type_key: e.target.value } : item)))
                      }
                      placeholder="e.g. annual_leave"
                    />
                  </div>
                  <div className="col-span-3">
                    <FormInput
                      type="number"
                      min={0}
                      step="0.5"
                      value={row.days}
                      onChange={(e) =>
                        setLeaveOverrideRows((prev) => prev.map((item, i) => (i === index ? { ...item, days: e.target.value } : item)))
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline-danger"
                      className="w-full"
                      onClick={() => setLeaveOverrideRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))}
                    >
                      <Lucide icon="XCircle" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Table className="mt-4">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Scope</Table.Th>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {leaveOverrides.length ? leaveOverrides.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.scope_type}</Table.Td>
                    <Table.Td>{scopeLabel(row.scope_type, row.scope_id)}</Table.Td>
                    <Table.Td>{row.priority}</Table.Td>
                    <Table.Td>
                      <Button variant="outline-danger" size="sm" onClick={() => void deactivateOverride(row.id)}>
                        <Lucide icon="Trash2" className="w-3 h-3 mr-1" /> Disable
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )) : (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-slate-500">No active leave overrides.</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
        </>
      ) : null}
    </>
  );
}

export default HrSettingsPage;
