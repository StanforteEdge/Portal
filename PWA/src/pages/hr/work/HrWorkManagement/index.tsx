import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import TomSelect from "@/components/Base/TomSelect";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import { listUsers } from "@/services/users";
import {
  approveWorkLog,
  createTeamGoal,
  createTeamKpi,
  createTeamObjective,
  createWorkItem,
  listTeamGoals,
  listTeamKpis,
  listTeamObjectives,
  listTeamWorkItems,
  listTeamWorkLogs,
  rejectWorkLog,
  updateWorkItem,
} from "@/services/workManagement";
import { formatDisplayDate } from "@/utils/formatting";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

const emptyItem = {
  title: "",
  description: "",
  item_type: "weekly_task",
  priority: "medium",
  assigned_to_id: "",
  due_date: "",
  week_start_date: "",
  expected_hours: "",
  organization_id: "",
  owner_team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  goal_id: "",
  objective_id: "",
  kpi_id: "",
  requires_manager_ack: true,
};

const emptyGoal = { title: "", description: "", period_year: new Date().getFullYear(), period_type: "annual", period_label: "", team_id: "", organization_id: "" };
const emptyObjective = { title: "", description: "", goal_id: "", team_id: "", organization_id: "", due_date: "" };
const emptyKpi = { title: "", description: "", goal_id: "", objective_id: "", team_id: "", organization_id: "", target_type: "count", target_value: "", unit_label: "", period_year: new Date().getFullYear(), quarter: "" };

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function HrWorkManagementPage() {
  const auth = useAppSelector(selectAuthState);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showObjectiveEditor, setShowObjectiveEditor] = useState(false);
  const [showKpiEditor, setShowKpiEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<any>(emptyItem);
  const [goalForm, setGoalForm] = useState<any>(emptyGoal);
  const [objectiveForm, setObjectiveForm] = useState<any>(emptyObjective);
  const [kpiForm, setKpiForm] = useState<any>(emptyKpi);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => toDateInputValue(getWeekStart()));
  const [plannerView, setPlannerView] = useState<"board" | "table">("board");
  const showOrganizationField = organizations.length > 1;
  const showTeamField = teams.length > 1;

  useEffect(() => {
    const primaryOrganizationId = (auth.user as any)?.primaryOrganizationId;
    const primaryTeamId = (auth.user as any)?.employee_profile?.primaryTeamId ?? (auth.user as any)?.primaryTeamId;
    if (organizations.length === 1 && !form.organization_id) {
      setForm((prev: any) => ({ ...prev, organization_id: String(organizations[0].id) }));
    } else if (!showOrganizationField && primaryOrganizationId && !form.organization_id) {
      setForm((prev: any) => ({ ...prev, organization_id: String(primaryOrganizationId) }));
    }
    if (teams.length === 1 && !form.owner_team_id) {
      setForm((prev: any) => ({ ...prev, owner_team_id: String(teams[0].id) }));
    } else if (!showTeamField && primaryTeamId && !form.owner_team_id) {
      setForm((prev: any) => ({ ...prev, owner_team_id: String(primaryTeamId) }));
    }
  }, [auth.user, form.organization_id, form.owner_team_id, organizations, showOrganizationField, showTeamField, teams]);

  const load = async () => {
    try {
      const [itemRows, logRows, userRes, orgRows, teamRows, projectRows, goalRows, objectiveRows, kpiRows] = await Promise.all([
        listTeamWorkItems({
          ...(selectedTeamId ? { team_id: selectedTeamId } : {}),
          ...(selectedAssigneeId ? { assigned_to_id: selectedAssigneeId } : {}),
          ...(selectedStatus ? { status: selectedStatus } : {}),
          ...(selectedWeekStart ? { week_start_date: selectedWeekStart } : {}),
        }),
        listTeamWorkLogs({
          approval_status: "submitted",
          ...(selectedTeamId ? { team_id: selectedTeamId } : {}),
          ...(selectedAssigneeId ? { staff_id: selectedAssigneeId } : {}),
          ...(selectedWeekStart ? { week_start_date: selectedWeekStart } : {}),
        }),
        listUsers({ page: 1, per_page: 200, status: "active" }).catch(() => ({ data: [] })),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listTeamGoals().catch(() => []),
        listTeamObjectives().catch(() => []),
        listTeamKpis().catch(() => []),
      ]);
      setItems(itemRows);
      setLogs(logRows);
      setUsers(userRes.data || []);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setGoals(goalRows);
      setObjectives(objectiveRows);
      setKpis(kpiRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load team work." });
    }
  };

  useEffect(() => {
    void load();
  }, [selectedAssigneeId, selectedStatus, selectedTeamId, selectedWeekStart]);

  const stats = useMemo(() => ({
    items: items.length,
    pendingLogs: logs.length,
    completed: items.filter((row) => row.status === "completed").length,
    assigned: new Set(items.map((row) => row.assigned_to_id).filter(Boolean)).size,
  }), [items, logs]);

  const weekDays = useMemo(() => {
    const weekStart = selectedWeekStart ? new Date(selectedWeekStart) : getWeekStart();
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return {
        key: toDateInputValue(date),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        fullLabel: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        date,
      };
    });
  }, [selectedWeekStart]);

  const boardColumns = useMemo(() => {
    const byDay = new Map<string, any[]>();
    weekDays.forEach((day) => byDay.set(day.key, []));
    items.forEach((item) => {
      const sourceDate = item.due_date || item.week_start_date;
      if (!sourceDate) return;
      const key = String(sourceDate).slice(0, 10);
      if (!byDay.has(key)) return;
      byDay.get(key)?.push(item);
    });
    return weekDays.map((day) => ({
      ...day,
      items: byDay.get(day.key) ?? [],
    }));
  }, [items, weekDays]);

  const save = async () => {
    try {
      const payload = {
        ...form,
        expected_hours: form.expected_hours ? Number(form.expected_hours) : undefined,
      };
      if (editingId) await updateWorkItem(editingId, payload);
      else await createWorkItem(payload);
      setShowEditor(false);
      setEditingId("");
      setForm(emptyItem);
      setNotice({ tone: "success", message: `Team work item ${editingId ? "updated" : "created"}.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save team work item." });
    }
  };

  const saveGoal = async () => {
    try {
      await createTeamGoal(goalForm);
      setShowGoalEditor(false);
      setGoalForm(emptyGoal);
      setNotice({ tone: "success", message: "Goal created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save goal." });
    }
  };

  const saveObjective = async () => {
    try {
      await createTeamObjective(objectiveForm);
      setShowObjectiveEditor(false);
      setObjectiveForm(emptyObjective);
      setNotice({ tone: "success", message: "Objective created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save objective." });
    }
  };

  const saveKpi = async () => {
    try {
      await createTeamKpi({
        ...kpiForm,
        target_value: kpiForm.target_value ? Number(kpiForm.target_value) : undefined,
        quarter: kpiForm.quarter ? Number(kpiForm.quarter) : undefined,
      });
      setShowKpiEditor(false);
      setKpiForm(emptyKpi);
      setNotice({ tone: "success", message: "KPI created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save KPI." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Team Work Planner</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()}><Lucide icon="Undo2" className="w-4 h-4 mr-1" />Refresh</Button>
          <Button variant="outline-secondary" onClick={() => { setGoalForm(emptyGoal); setShowGoalEditor(true); }}>New Goal</Button>
          <Button variant="outline-secondary" onClick={() => { setObjectiveForm(emptyObjective); setShowObjectiveEditor(true); }}>New Objective</Button>
          <Button variant="outline-secondary" onClick={() => { setKpiForm(emptyKpi); setShowKpiEditor(true); }}>New KPI</Button>
          <Button variant="primary" onClick={() => { setEditingId(""); setForm(emptyItem); setShowEditor(true); }}><Lucide icon="Plus" className="w-4 h-4 mr-1" />New Weekly Task</Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5"><div className="text-sm text-slate-500">Tracked Items</div><div className="mt-2 text-2xl font-semibold">{stats.items}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Assigned Staff</div><div className="mt-2 text-2xl font-semibold">{stats.assigned}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Completed</div><div className="mt-2 text-2xl font-semibold">{stats.completed}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Logs Waiting Review</div><div className="mt-2 text-2xl font-semibold">{stats.pendingLogs}</div></div>
      </div>

      <div className="box p-5 mt-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {teams.length > 1 ? <div>
            <FormLabel>Team Filter</FormLabel>
            <TomSelect value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
              <option value="">All teams</option>
              {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </TomSelect>
          </div> : <div className="hidden xl:block" />}
          <div>
            <FormLabel>Assignee Filter</FormLabel>
            <TomSelect value={selectedAssigneeId} onChange={(e) => setSelectedAssigneeId(e.target.value)}>
              <option value="">All staff</option>
              {users.map((row) => <option key={row.id} value={row.id}>{[row.firstName, row.lastName].filter(Boolean).join(" ") || row.email}</option>)}
            </TomSelect>
          </div>
          <div>
            <FormLabel>Week Of</FormLabel>
            <FormInput type="date" value={selectedWeekStart} onChange={(e) => setSelectedWeekStart(e.target.value)} />
          </div>
          <div>
            <FormLabel>Status Filter</FormLabel>
            <FormSelect value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="carried_over">Carried Over</option>
              <option value="cancelled">Cancelled</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>View</FormLabel>
            <div className="flex gap-2">
              <Button variant={plannerView === "board" ? "primary" : "outline-secondary"} onClick={() => setPlannerView("board")} className="flex-1">Weekly Board</Button>
              <Button variant={plannerView === "table" ? "primary" : "outline-secondary"} onClick={() => setPlannerView("table")} className="flex-1">Table</Button>
            </div>
          </div>
        </div>
      </div>

      {plannerView === "board" ? (
        <div className="grid grid-cols-1 gap-4 mt-5 xl:grid-cols-7">
          {boardColumns.map((day) => (
            <div key={day.key} className="box p-4 min-h-[220px]">
              <div className="border-b border-slate-200 pb-3">
                <div className="text-sm text-slate-500">{day.label}</div>
                <div className="font-medium">{day.fullLabel}</div>
              </div>
              <div className="mt-4 space-y-3">
                {day.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:border-primary/40 hover:bg-white"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        ...emptyItem,
                        ...item,
                        due_date: item.due_date ? String(item.due_date).slice(0, 10) : "",
                        week_start_date: item.week_start_date ? String(item.week_start_date).slice(0, 10) : "",
                        expected_hours: item.expected_hours ? String(item.expected_hours) : "",
                      });
                      setShowEditor(true);
                    }}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.assigned_to?.full_name || "Unassigned"}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.project?.name || item.objective?.title || item.goal?.title || "General work"}</div>
                    <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">{String(item.status || "planned").replaceAll("_", " ")}</div>
                  </button>
                ))}
                {!day.items.length ? <div className="rounded border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">No planned work</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600 mb-4">
            Team leads and line managers plan weekly work here, then staff update the actual day-by-day execution in their tracker. Link the task to the right project, goal, objective, or KPI. Fund and grant allocation stays with finance later.
          </div>
          <h3 className="font-medium">Planned Work</h3>
          {plannerView === "table" ? <Table className="mt-4">
            <Table.Thead><Table.Tr><Table.Th>Task</Table.Th><Table.Th>Assignee</Table.Th><Table.Th>Week</Table.Th><Table.Th className="text-right">Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {items.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.RowHeader>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-slate-500">{row.project?.name || row.objective?.title || row.goal?.title || "General work"} · {row.status}</div>
                  </Table.RowHeader>
                  <Table.Td>{row.assigned_to?.full_name || "-"}</Table.Td>
                  <Table.Td>{row.week_start_date ? formatDisplayDate(row.week_start_date) : "-"}</Table.Td>
                  <Table.Td className="text-right"><Button size="sm" variant="outline-secondary" onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      ...emptyItem,
                      ...row,
                      due_date: row.due_date ? String(row.due_date).slice(0, 10) : "",
                      week_start_date: row.week_start_date ? String(row.week_start_date).slice(0, 10) : "",
                      expected_hours: row.expected_hours ? String(row.expected_hours) : "",
                    });
                    setShowEditor(true);
                  }}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button></Table.Td>
                </Table.Tr>
              ))}
              {!items.length ? <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-10">No planned work yet.</Table.Td></Table.Tr> : null}
            </Table.Tbody>
          </Table> : <div className="mt-4 text-sm text-slate-500">Table view is hidden while Weekly Board is active.</div>}
        </div>

        <div className="box p-5">
          <h3 className="font-medium">Submitted Daily Logs</h3>
          <Table className="mt-4">
            <Table.Thead><Table.Tr><Table.Th>Staff</Table.Th><Table.Th>Date</Table.Th><Table.Th>Hours</Table.Th><Table.Th className="text-right">Review</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {logs.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.RowHeader>
                    <div className="font-medium">{row.staff?.full_name || "-"}</div>
                    <div className="text-xs text-slate-500">{row.work_item?.title || "-"} · {row.status}</div>
                  </Table.RowHeader>
                  <Table.Td>{formatDisplayDate(row.log_date)}</Table.Td>
                  <Table.Td>{row.hours_spent}</Table.Td>
                  <Table.Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => void approveWorkLog(row.id).then(load)}><Lucide icon="CheckCheck" className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline-danger" onClick={() => void rejectWorkLog(row.id).then(load)}><Lucide icon="XCircle" className="w-4 h-4" /></Button>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!logs.length ? <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-10">No submitted logs waiting review.</Table.Td></Table.Tr> : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingId ? "Edit Team Task" : "New Team Task"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Use this form for weekly tasks or project activities that staff should execute and track daily. Keep the brief clear, assign the owner, and link it to the right project or KPI.
            </div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Title</FormLabel><FormInput value={form.title} onChange={(e) => setForm((prev: any) => ({ ...prev, title: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Assignee</FormLabel><TomSelect value={form.assigned_to_id} onChange={(e) => setForm((prev: any) => ({ ...prev, assigned_to_id: e.target.value }))}><option value="">Select staff</option>{users.map((row) => <option key={row.id} value={row.id}>{[row.firstName, row.lastName].filter(Boolean).join(" ") || row.email}</option>)}</TomSelect></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={form.description} onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Type</FormLabel><FormSelect value={form.item_type} onChange={(e) => setForm((prev: any) => ({ ...prev, item_type: e.target.value }))}><option value="weekly_task">Weekly Task</option><option value="project_activity">Project Activity</option><option value="recurring_responsibility">Recurring Responsibility</option></FormSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Priority</FormLabel><FormSelect value={form.priority} onChange={(e) => setForm((prev: any) => ({ ...prev, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></FormSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Week Start</FormLabel><FormInput type="date" value={form.week_start_date} onChange={(e) => setForm((prev: any) => ({ ...prev, week_start_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Due Date</FormLabel><FormInput type="date" value={form.due_date} onChange={(e) => setForm((prev: any) => ({ ...prev, due_date: e.target.value }))} /></div>
            {showOrganizationField ? <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><TomSelect value={form.organization_id} onChange={(e) => setForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}><option value="">None</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
            {showTeamField ? <div className="col-span-12 md:col-span-4"><FormLabel>Team</FormLabel><TomSelect value={form.owner_team_id} onChange={(e) => setForm((prev: any) => ({ ...prev, owner_team_id: e.target.value }))}><option value="">None</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
            <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><TomSelect value={form.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, project_id: e.target.value }))}><option value="">None</option>{projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-12"><div className="rounded border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600">Finance will decide fund and grant charging later. Planner entries only need the operational project and the goal/objective/KPI linkage.</div></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Expected Hours</FormLabel><FormInput type="number" value={form.expected_hours} onChange={(e) => setForm((prev: any) => ({ ...prev, expected_hours: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Goal</FormLabel><TomSelect value={form.goal_id} onChange={(e) => setForm((prev: any) => ({ ...prev, goal_id: e.target.value, objective_id: "", kpi_id: "" }))}><option value="">None</option>{goals.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Objective</FormLabel><TomSelect value={form.objective_id} onChange={(e) => setForm((prev: any) => ({ ...prev, objective_id: e.target.value, kpi_id: "" }))}><option value="">None</option>{objectives.filter((row) => !form.goal_id || row.goal_id === form.goal_id).map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>KPI</FormLabel><TomSelect value={form.kpi_id} onChange={(e) => setForm((prev: any) => ({ ...prev, kpi_id: e.target.value }))}><option value="">None</option>{kpis.filter((row) => (!form.goal_id || row.goal_id === form.goal_id) && (!form.objective_id || row.objective_id === form.objective_id)).map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void save()}>Save</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showGoalEditor} onClose={() => setShowGoalEditor(false)} size="lg">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">New Goal</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12"><FormLabel>Title</FormLabel><FormInput value={goalForm.title} onChange={(e) => setGoalForm((p: any) => ({ ...p, title: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={goalForm.description} onChange={(e) => setGoalForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Year</FormLabel><FormInput type="number" value={goalForm.period_year} onChange={(e) => setGoalForm((p: any) => ({ ...p, period_year: Number(e.target.value) }))} /></div>
            {showOrganizationField ? <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><TomSelect value={goalForm.organization_id} onChange={(e) => setGoalForm((p: any) => ({ ...p, organization_id: e.target.value }))}><option value="">None</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
            {showTeamField ? <div className="col-span-12 md:col-span-4"><FormLabel>Team</FormLabel><TomSelect value={goalForm.team_id} onChange={(e) => setGoalForm((p: any) => ({ ...p, team_id: e.target.value }))}><option value="">None</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowGoalEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveGoal()}>Save Goal</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showObjectiveEditor} onClose={() => setShowObjectiveEditor(false)} size="lg">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">New Objective</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12"><FormLabel>Title</FormLabel><FormInput value={objectiveForm.title} onChange={(e) => setObjectiveForm((p: any) => ({ ...p, title: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={objectiveForm.description} onChange={(e) => setObjectiveForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Goal</FormLabel><TomSelect value={objectiveForm.goal_id} onChange={(e) => setObjectiveForm((p: any) => ({ ...p, goal_id: e.target.value }))}><option value="">None</option>{goals.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Due Date</FormLabel><FormInput type="date" value={objectiveForm.due_date} onChange={(e) => setObjectiveForm((p: any) => ({ ...p, due_date: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowObjectiveEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveObjective()}>Save Objective</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showKpiEditor} onClose={() => setShowKpiEditor(false)} size="lg">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">New KPI</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12"><FormLabel>Title</FormLabel><FormInput value={kpiForm.title} onChange={(e) => setKpiForm((p: any) => ({ ...p, title: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Goal</FormLabel><TomSelect value={kpiForm.goal_id} onChange={(e) => setKpiForm((p: any) => ({ ...p, goal_id: e.target.value, objective_id: "" }))}><option value="">None</option>{goals.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Objective</FormLabel><TomSelect value={kpiForm.objective_id} onChange={(e) => setKpiForm((p: any) => ({ ...p, objective_id: e.target.value }))}><option value="">None</option>{objectives.filter((row) => !kpiForm.goal_id || row.goal_id === kpiForm.goal_id).map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Target Type</FormLabel><FormSelect value={kpiForm.target_type} onChange={(e) => setKpiForm((p: any) => ({ ...p, target_type: e.target.value }))}><option value="count">Count</option><option value="percentage">Percentage</option><option value="currency">Currency</option><option value="milestone">Milestone</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Target Value</FormLabel><FormInput type="number" value={kpiForm.target_value} onChange={(e) => setKpiForm((p: any) => ({ ...p, target_value: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Unit</FormLabel><FormInput value={kpiForm.unit_label} onChange={(e) => setKpiForm((p: any) => ({ ...p, unit_label: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowKpiEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveKpi()}>Save KPI</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default HrWorkManagementPage;
