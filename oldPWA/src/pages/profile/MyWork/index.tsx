import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import TomSelect from "@/components/Base/TomSelect";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listMyOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import {
  createWorkItem,
  createWorkLog,
  getMyWorkTimesheetSummary,
  listMyWorkItems,
  listMyWorkLogs,
  listTeamGoals,
  listTeamKpis,
  listTeamObjectives,
  submitWorkLog,
  updateWorkItem,
  updateWorkLog,
} from "@/services/workManagement";
import { formatDisplayDate } from "@/utils/formatting";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";
import { getMyProfile } from "@/services/profile";

const emptyItem = {
  title: "",
  description: "",
  item_type: "ad_hoc",
  priority: "medium",
  due_date: "",
  expected_hours: "",
  organization_id: "",
  owner_team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  goal_id: "",
  objective_id: "",
  kpi_id: "",
  is_staff_added: true,
};

const emptyLog = {
  work_item_id: "",
  log_date: "",
  hours_spent: "",
  status: "in_progress",
  progress_percent: "",
  note: "",
  blocker_note: "",
  carried_over: false,
  carry_over_to_date: "",
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
};

function MyWorkPage() {
  const auth = useAppSelector(selectAuthState);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [showLogEditor, setShowLogEditor] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const [editingLogId, setEditingLogId] = useState("");
  const [itemForm, setItemForm] = useState<any>(emptyItem);
  const [logForm, setLogForm] = useState<any>(emptyLog);
  const showOrganizationField = organizations.length > 1;
  const showTeamField = teams.length > 1;

  useEffect(() => {
    const primaryOrganizationId = (auth.user as any)?.primaryOrganizationId;
    const primaryTeamId = (auth.user as any)?.employee_profile?.primaryTeamId ?? (auth.user as any)?.primaryTeamId;
    if (organizations.length === 1 && !itemForm.organization_id) {
      setItemForm((prev: any) => ({ ...prev, organization_id: String(organizations[0].id) }));
    } else if (!showOrganizationField && primaryOrganizationId && !itemForm.organization_id) {
      setItemForm((prev: any) => ({ ...prev, organization_id: String(primaryOrganizationId) }));
    }
    if (teams.length === 1 && !itemForm.owner_team_id) {
      setItemForm((prev: any) => ({ ...prev, owner_team_id: String(teams[0].id) }));
    } else if (!showTeamField && primaryTeamId && !itemForm.owner_team_id) {
      setItemForm((prev: any) => ({ ...prev, owner_team_id: String(primaryTeamId) }));
    }
  }, [auth.user, itemForm.organization_id, itemForm.owner_team_id, organizations, showOrganizationField, showTeamField, teams]);

  const load = async () => {
    try {
      const [itemRows, logRows, timesheetRows, orgRows, teamRows, projectRows, goalRows, objectiveRows, kpiRows] = await Promise.all([
        listMyWorkItems(),
        listMyWorkLogs(),
        getMyWorkTimesheetSummary(),
        listMyOrganizations().catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listTeamGoals().catch(() => []),
        listTeamObjectives().catch(() => []),
        listTeamKpis().catch(() => []),
      ]);
      const myProfile = await getMyProfile().catch(() => null);
      const nextUserId = myProfile?.id ? String(myProfile.id) : "";
      const myTeams =
        nextUserId.length > 0
          ? teamRows.filter((team: any) => (team.members || []).some((member: any) => String(member.userId) === nextUserId))
          : [];
      setItems(itemRows);
      setLogs(logRows);
      setSummary(timesheetRows);
      setOrganizations(orgRows.map((row: any) => row.organization ?? row).filter(Boolean));
      setTeams(myTeams);
      setProjects(projectRows);
      setGoals(goalRows);
      setObjectives(objectiveRows);
      setKpis(kpiRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load work tracker." });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => ({
    items: items.length,
    open: items.filter((row) => !["completed", "cancelled"].includes(row.status)).length,
    hours: logs.reduce((sum, row) => sum + Number(row.hours_spent || 0), 0),
    submitted: logs.filter((row) => row.approval_status === "submitted").length,
  }), [items, logs]);

  const saveItem = async () => {
    try {
      const payload = {
        ...itemForm,
        expected_hours: itemForm.expected_hours ? Number(itemForm.expected_hours) : undefined,
      };
      if (editingItemId) await updateWorkItem(editingItemId, payload);
      else await createWorkItem(payload);
      setShowItemEditor(false);
      setEditingItemId("");
      setItemForm(emptyItem);
      setNotice({ tone: "success", message: `Work item ${editingItemId ? "updated" : "saved"}.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save work item." });
    }
  };

  const saveLog = async () => {
    try {
      const payload = {
        ...logForm,
        hours_spent: Number(logForm.hours_spent || 0),
        progress_percent: logForm.progress_percent ? Number(logForm.progress_percent) : undefined,
      };
      if (editingLogId) await updateWorkLog(editingLogId, payload);
      else await createWorkLog(payload);
      setShowLogEditor(false);
      setEditingLogId("");
      setLogForm(emptyLog);
      setNotice({ tone: "success", message: `Daily log ${editingLogId ? "updated" : "saved"}.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save daily log." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Work Tracker</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()}><Lucide icon="Undo2" className="w-4 h-4 mr-1" />Refresh</Button>
          <Button variant="outline-primary" onClick={() => { setEditingItemId(""); setItemForm(emptyItem); setShowItemEditor(true); }}><Lucide icon="Plus" className="w-4 h-4 mr-1" />Add Work Item</Button>
          <Button variant="primary" onClick={() => { setEditingLogId(""); setLogForm({ ...emptyLog, log_date: new Date().toISOString().slice(0, 10) }); setShowLogEditor(true); }}><Lucide icon="Clock3" className="w-4 h-4 mr-1" />Log Today</Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5"><div className="text-sm text-slate-500">Work Items</div><div className="mt-2 text-2xl font-semibold">{stats.items}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Open Work</div><div className="mt-2 text-2xl font-semibold">{stats.open}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Hours Logged</div><div className="mt-2 text-2xl font-semibold">{stats.hours.toFixed(1)}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Awaiting Review</div><div className="mt-2 text-2xl font-semibold">{stats.submitted}</div></div>
      </div>

      <div className="box p-5 mt-5">
        <div className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Team leads can assign weekly work, and you can also add ad hoc work that came up during the day. Your daily log is the actual execution record: what you worked on, how long it took, what got completed, what got blocked, and what needs to carry over. Project links live here, while fund and grant allocation remain a finance decision later in the process.
        </div>
        <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
          <div>
            <h3 className="font-medium">My Work Items</h3>
            <Table className="mt-3">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Task</Table.Th>
                  <Table.Th>Due</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th className="text-right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.RowHeader>
                      <div className="font-medium">{row.title}</div>
                      <div className="text-xs text-slate-500">{row.project?.name || row.objective?.title || row.goal?.title || "General work"}</div>
                    </Table.RowHeader>
                    <Table.Td>{row.due_date ? formatDisplayDate(row.due_date) : "-"}</Table.Td>
                    <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                    <Table.Td className="text-right">
                      <Button size="sm" variant="outline-secondary" onClick={() => {
                        setEditingItemId(row.id);
                        setItemForm({
                          ...emptyItem,
                          ...row,
                          due_date: row.due_date ? String(row.due_date).slice(0, 10) : "",
                          planned_start_date: row.planned_start_date ? String(row.planned_start_date).slice(0, 10) : "",
                          week_start_date: row.week_start_date ? String(row.week_start_date).slice(0, 10) : "",
                          expected_hours: row.expected_hours ? String(row.expected_hours) : "",
                        });
                        setShowItemEditor(true);
                      }}>
                        <Lucide icon="FilePenLine" className="w-4 h-4" />
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!items.length ? <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-10">No work items yet.</Table.Td></Table.Tr> : null}
              </Table.Tbody>
            </Table>
          </div>
          <div>
            <h3 className="font-medium">Daily Logs</h3>
            <Table className="mt-3">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Work</Table.Th>
                  <Table.Th>Hours</Table.Th>
                  <Table.Th className="text-right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{formatDisplayDate(row.log_date)}</Table.Td>
                    <Table.RowHeader>
                      <div className="font-medium">{row.work_item?.title || "-"}</div>
                      <div className="text-xs text-slate-500">{row.approval_status} · {row.status}</div>
                    </Table.RowHeader>
                    <Table.Td>{row.hours_spent}</Table.Td>
                    <Table.Td className="text-right">
                      <div className="flex justify-end gap-2">
                        {["draft", "rejected"].includes(row.approval_status) ? <Button size="sm" variant="outline-secondary" onClick={() => {
                          setEditingLogId(row.id);
                          setLogForm({
                            ...emptyLog,
                            ...row,
                            work_item_id: row.work_item_id,
                            log_date: String(row.log_date).slice(0, 10),
                            hours_spent: String(row.hours_spent || ""),
                            progress_percent: row.progress_percent != null ? String(row.progress_percent) : "",
                            carry_over_to_date: row.carry_over_to_date ? String(row.carry_over_to_date).slice(0, 10) : "",
                          });
                          setShowLogEditor(true);
                        }}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button> : null}
                        {["draft", "rejected"].includes(row.approval_status) ? <Button size="sm" variant="outline-primary" onClick={() => void submitWorkLog(row.id).then(load)}><Lucide icon="Send" className="w-4 h-4" /></Button> : null}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!logs.length ? <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-10">No daily logs yet.</Table.Td></Table.Tr> : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <h3 className="font-medium">Timesheet Summary From Approved Work</h3>
        <Table className="mt-3">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Coverage</Table.Th>
              <Table.Th>Hours</Table.Th>
              <Table.Th>Entries</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {summary.map((row, index) => (
              <Table.Tr key={`${row.project_id}-${index}`}>
                <Table.RowHeader>
                  <div className="font-medium">{row.project_name}</div>
                  <div className="text-xs text-slate-500">{row.team_name} · {row.fund_name} · {row.grant_name}</div>
                </Table.RowHeader>
                <Table.Td>{Number(row.hours || 0).toFixed(1)}</Table.Td>
                <Table.Td>{row.entries}</Table.Td>
              </Table.Tr>
            ))}
            {!summary.length ? <Table.Tr><Table.Td colSpan={3} className="text-center text-slate-500 py-10">No submitted work logs yet.</Table.Td></Table.Tr> : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showItemEditor} onClose={() => setShowItemEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingItemId ? "Edit Ad Hoc Work" : "Add Ad Hoc Work"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Use this when unplanned work comes up during the day. Choose the project or objective it supports, then log the actual time separately in your daily tracker.
            </div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Title</FormLabel><FormInput value={itemForm.title} onChange={(e) => setItemForm((prev: any) => ({ ...prev, title: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Priority</FormLabel><FormSelect value={itemForm.priority} onChange={(e) => setItemForm((prev: any) => ({ ...prev, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></FormSelect></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={itemForm.description} onChange={(e) => setItemForm((prev: any) => ({ ...prev, description: e.target.value }))} /></div>
            {showOrganizationField ? <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><TomSelect value={itemForm.organization_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}><option value="">None</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
            {showTeamField ? <div className="col-span-12 md:col-span-4"><FormLabel>Team</FormLabel><TomSelect value={itemForm.owner_team_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, owner_team_id: e.target.value }))}><option value="">None</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div> : null}
            <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><TomSelect value={itemForm.project_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, project_id: e.target.value }))}><option value="">None</option>{projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Expected Hours</FormLabel><FormInput type="number" value={itemForm.expected_hours} onChange={(e) => setItemForm((prev: any) => ({ ...prev, expected_hours: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Carry Into / Due Date</FormLabel><FormInput type="date" value={itemForm.due_date} onChange={(e) => setItemForm((prev: any) => ({ ...prev, due_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Goal</FormLabel><TomSelect value={itemForm.goal_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, goal_id: e.target.value, objective_id: "", kpi_id: "" }))}><option value="">None</option>{goals.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Objective</FormLabel><TomSelect value={itemForm.objective_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, objective_id: e.target.value, kpi_id: "" }))}><option value="">None</option>{objectives.filter((row) => !itemForm.goal_id || row.goal_id === itemForm.goal_id).map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>KPI</FormLabel><TomSelect value={itemForm.kpi_id} onChange={(e) => setItemForm((prev: any) => ({ ...prev, kpi_id: e.target.value }))}><option value="">None</option>{kpis.filter((row) => (!itemForm.goal_id || row.goal_id === itemForm.goal_id) && (!itemForm.objective_id || row.objective_id === itemForm.objective_id)).map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowItemEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveItem()}>Save</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showLogEditor} onClose={() => setShowLogEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingLogId ? "Edit Daily Log" : "New Daily Log"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Log the actual work done today. If it is not finished, mark it as blocked or carried over and capture what needs to happen next.
            </div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Work Item</FormLabel><TomSelect value={logForm.work_item_id} onChange={(e) => setLogForm((prev: any) => ({ ...prev, work_item_id: e.target.value }))}><option value="">Select work item</option>{items.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Log Date</FormLabel><FormInput type="date" value={logForm.log_date} onChange={(e) => setLogForm((prev: any) => ({ ...prev, log_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Hours</FormLabel><FormInput type="number" value={logForm.hours_spent} onChange={(e) => setLogForm((prev: any) => ({ ...prev, hours_spent: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Status</FormLabel><FormSelect value={logForm.status} onChange={(e) => setLogForm((prev: any) => ({ ...prev, status: e.target.value }))}><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option><option value="carried_over">Carried Over</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Progress %</FormLabel><FormInput type="number" value={logForm.progress_percent} onChange={(e) => setLogForm((prev: any) => ({ ...prev, progress_percent: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Carry Over To</FormLabel><FormInput type="date" value={logForm.carry_over_to_date} onChange={(e) => setLogForm((prev: any) => ({ ...prev, carry_over_to_date: e.target.value, carried_over: !!e.target.value, status: e.target.value ? "carried_over" : prev.status }))} /></div>
            <div className="col-span-12"><FormLabel>Note</FormLabel><FormTextarea rows={3} value={logForm.note} onChange={(e) => setLogForm((prev: any) => ({ ...prev, note: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Blocker Note</FormLabel><FormTextarea rows={2} value={logForm.blocker_note} onChange={(e) => setLogForm((prev: any) => ({ ...prev, blocker_note: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={() => setShowLogEditor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveLog()}>Save</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default MyWorkPage;
