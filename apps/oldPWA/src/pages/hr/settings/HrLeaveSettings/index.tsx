import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
type LeaveSettingsStep = "types" | "overrides";
type LeaveOverrideRow = { leave_type_key: string; days: string };

type OverrideForm = {
  scope_type: ScopeType;
  scope_id: string;
  priority: string;
};

const emptyLeaveRow: LeaveOverrideRow = { leave_type_key: "", days: "0" };

const defaultOverrideForm: OverrideForm = {
  scope_type: "organization",
  scope_id: "",
  priority: "100",
};

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

function normalizeLeaveKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveRequestTypeLeaveKey(type: RequestTypeOption) {
  const schema = (type.form_schema || {}) as Record<string, unknown>;
  const fromSchema = normalizeLeaveKey(String(schema.leave_type_key || ""));
  if (fromSchema) return fromSchema;
  return normalizeLeaveKey(String(type.name || ""));
}

function getRequestTypeEntitledDays(type: RequestTypeOption) {
  const schema = (type.form_schema || {}) as Record<string, unknown>;
  const value = Number(schema.entitled_days_per_year ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getRequestTypeMaxCarryoverDays(type: RequestTypeOption) {
  const schema = (type.form_schema || {}) as Record<string, unknown>;
  const value = Number(schema.max_carryover_days ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isLeaveRequestType(type: RequestTypeOption) {
  const categoryKey = String(type.category_key ?? "").toLowerCase();
  const typeName = String(type.name ?? "").toLowerCase();
  const schema = (type.form_schema || {}) as Record<string, unknown>;
  const schemaLeaveTypeKey = String(schema.leave_type_key || "").trim().toLowerCase();
  return categoryKey.includes("leave") || typeName.includes("leave") || schemaLeaveTypeKey.length > 0;
}

function HrLeaveSettingsPage() {
  const [activeStep, setActiveStep] = useState<LeaveSettingsStep>("types");

  const [leaveRequestTypePolicy, setLeaveRequestTypePolicy] = useState<PolicyRecord | null>(null);
  const [leaveOverrides, setLeaveOverrides] = useState<PolicyRecord[]>([]);
  const [leaveRequestTypes, setLeaveRequestTypes] = useState<RequestTypeOption[]>([]);
  const [defaultLeaveRequestTypeId, setDefaultLeaveRequestTypeId] = useState("");

  const [leaveOverrideForm, setLeaveOverrideForm] = useState<OverrideForm>(defaultOverrideForm);
  const [leaveOverrideRows, setLeaveOverrideRows] = useState<LeaveOverrideRow[]>([emptyLeaveRow]);

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [savingLeaveRequestType, setSavingLeaveRequestType] = useState(false);
  const [savingLeaveOverride, setSavingLeaveOverride] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const leaveTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    return leaveRequestTypes
      .map((type) => {
        const key = resolveRequestTypeLeaveKey(type);
        if (!key || seen.has(key)) return null;
        seen.add(key);
        return { key, label: type.name };
      })
      .filter(Boolean) as Array<{ key: string; label: string }>;
  }, [leaveRequestTypes]);

  const load = async () => {
    try {
      setLoading(true);
      const [leaveRequestTypeRes, leaveOverridesRes] = await Promise.all([
        listPolicies({ module: "leave", policy_key: "leave_request_type", scope_type: "global", per_page: 1 }),
        listPolicies({ module: "leave", policy_key: "leave_entitlements", is_active: true, per_page: 200 }),
      ]);

      const leaveRequestType = leaveRequestTypeRes.data?.[0] ?? null;
      setLeaveRequestTypePolicy(leaveRequestType);

      const requestTypeId = String(
        ((leaveRequestType?.config_json as Record<string, unknown> | null)?.request_type_id as string | undefined) ?? ""
      );
      setDefaultLeaveRequestTypeId(requestTypeId);
      setLeaveOverrides((leaveOverridesRes.data ?? []).filter((row) => row.scope_type !== "global"));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load leave settings." });
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
      setLeaveRequestTypes((requestTypeRows || []).filter(isLeaveRequestType));
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    void Promise.all([load(), loadScopeOptions()]);
  }, []);

  const saveLeaveRequestType = async () => {
    if (!defaultLeaveRequestTypeId) {
      setNotice({ tone: "warning", message: "Select a default leave request type." });
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
        message: error?.response?.data?.error?.message || "Unable to save default leave request type.",
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

  const saveLeaveOverride = async () => {
    if (!leaveOverrideForm.scope_id) {
      setNotice({ tone: "warning", message: "Select a scope target for leave override." });
      return;
    }

    const config: Record<string, number> = {};
    for (const row of leaveOverrideRows) {
      const key = normalizeLeaveKey(row.leave_type_key);
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
      setLeaveOverrideRows([emptyLeaveRow]);
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
        <h2 className="mr-auto text-lg font-medium">HR Leave Settings</h2>
        <Button variant="outline-secondary" onClick={() => void Promise.all([load(), loadScopeOptions()])} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-2 mt-5">
        <div className="flex flex-wrap gap-2">
          <Link to="/appOld/hr/settings">
            <Button variant="outline-secondary">
              <Lucide icon="Clock3" className="w-4 h-4 mr-1" />
              Attendance Settings
            </Button>
          </Link>
          <Button variant="primary">
            <Lucide icon="BookOpen" className="w-4 h-4 mr-1" />
            Leave Settings
          </Button>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <div className="font-medium">Setup Order (Required)</div>
        <ol className="list-decimal pl-5 mt-2 text-sm text-slate-600 space-y-1">
          <li>Create HR leave request types and set Leave Rules (entitlement, carryover, half-day, notice, etc.).</li>
          <li>Set default leave request type for auto-selection on staff leave form.</li>
          <li>Add overrides only for org/team/staff/user exceptions.</li>
        </ol>
      </div>

      <div className="box p-2 mt-5">
        <div className="flex flex-wrap gap-2">
          <Button variant={activeStep === "types" ? "primary" : "outline-secondary"} onClick={() => setActiveStep("types")}>
            <Lucide icon="ListChecks" className="w-4 h-4 mr-1" />
            1. Request Types
          </Button>
          <Button variant={activeStep === "overrides" ? "primary" : "outline-secondary"} onClick={() => setActiveStep("overrides")}>
            <Lucide icon="Settings2" className="w-4 h-4 mr-1" />
            2. Overrides
          </Button>
        </div>
      </div>

      {activeStep === "types" ? (
        <div className="box p-5 mt-5">
          <div className="flex items-center">
            <h3 className="mr-auto text-base font-medium">Step 1: Leave Request Types</h3>
            <Button variant="primary" onClick={() => void saveLeaveRequestType()} disabled={savingLeaveRequestType}>
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
              {savingLeaveRequestType ? "Saving..." : "Save Default"}
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-2">Entitlement and carryover are defined directly on each leave request type.</div>

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
              <div className="text-sm font-medium">Configured HR Leave Request Types</div>
              <Link to="/appOld/hr/settings/request-types/new">
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
                  <Table.Th>Leave Key</Table.Th>
                  <Table.Th>Entitled/Year</Table.Th>
                  <Table.Th>Max Carryover</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {leaveRequestTypes.map((type) => {
                  const leaveKey = resolveRequestTypeLeaveKey(type);
                  return (
                    <Table.Tr key={type.id}>
                      <Table.Td>{type.name}</Table.Td>
                      <Table.Td>{type.code_prefix}</Table.Td>
                      <Table.Td>{leaveKey || "-"}</Table.Td>
                      <Table.Td>{getRequestTypeEntitledDays(type)}</Table.Td>
                      <Table.Td>{getRequestTypeMaxCarryoverDays(type)}</Table.Td>
                      <Table.Td>{type.is_active ? "Active" : "Inactive"}</Table.Td>
                      <Table.Td>
                        <Link to={`/appOld/hr/settings/request-types/${type.id}`}>
                          <Button variant="outline-secondary" size="sm">
                            <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {leaveRequestTypes.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-slate-500">
                      No HR leave request types found.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      ) : null}

      {activeStep === "overrides" ? (
        <div className="box p-5 mt-5 mb-10">
          <div className="flex items-center">
            <h3 className="mr-auto text-base font-medium">Step 2: Leave Overrides (Optional)</h3>
            <div className="flex gap-2">
              <Button
                variant="outline-primary"
                type="button"
                onClick={() =>
                  setLeaveOverrideRows((prev) => [...prev, { leave_type_key: leaveTypeOptions[0]?.key ?? "", days: "0" }])
                }
                disabled={leaveTypeOptions.length === 0}
              >
                <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                Add Leave Type
              </Button>
              <Button variant="primary" onClick={() => void saveLeaveOverride()} disabled={savingLeaveOverride}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                {savingLeaveOverride ? "Adding..." : "Add Override"}
              </Button>
            </div>
          </div>

          {leaveTypeOptions.length === 0 ? (
            <div className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              Create leave request types first in Step 1. Overrides only support configured leave request types.
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-3 mt-4">
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Scope</FormLabel>
              <FormSelect
                value={leaveOverrideForm.scope_type}
                onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, scope_type: e.target.value as ScopeType, scope_id: "" }))}
              >
                {scopeTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-5">
              <FormLabel>Target</FormLabel>
              <FormSelect value={leaveOverrideForm.scope_id} onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, scope_id: e.target.value }))}>
                <option value="">Select target</option>
                {scopeOptionsFor(leaveOverrideForm.scope_type).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormLabel>Priority</FormLabel>
              <FormInput
                type="number"
                min={0}
                value={leaveOverrideForm.priority}
                onChange={(e) => setLeaveOverrideForm((prev) => ({ ...prev, priority: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {leaveOverrideRows.map((row, index) => (
              <div key={`ovr-${row.leave_type_key}-${index}`} className="grid grid-cols-12 gap-2">
                <div className="col-span-8">
                  <FormSelect
                    value={row.leave_type_key}
                    onChange={(e) =>
                      setLeaveOverrideRows((prev) => prev.map((item, i) => (i === index ? { ...item, leave_type_key: e.target.value } : item)))
                    }
                    disabled={leaveTypeOptions.length === 0}
                  >
                    <option value="">Select leave type</option>
                    {leaveTypeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
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
              {leaveOverrides.length ? (
                leaveOverrides.map((row) => (
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
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-slate-500">
                    No active leave overrides.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      ) : null}
    </>
  );
}

export default HrLeaveSettingsPage;
