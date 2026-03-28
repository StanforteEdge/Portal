import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import { approveProjectTimesheet, createProjectTimesheet, listPayrollWorkers, listProjectTimesheets, rejectProjectTimesheet, submitProjectTimesheet, updateProjectTimesheet } from "@/services/payroll";
import { formatDisplayDate } from "@/utils/formatting";

const emptyForm = {
  worker_id: "",
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  work_date: "",
  hours: "",
  description: "",
  status: "draft",
};

function FinancePayrollTimesheetsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const [timesheetRows, workerRes, orgRows, teamRows, projectRows, fundRows, grantRows] = await Promise.all([
        listProjectTimesheets(),
        listPayrollWorkers({ page: 1, per_page: 200 }),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
      ]);
      setRows(timesheetRows);
      setWorkers(workerRes.data ?? []);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load project timesheets." });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      const payload = {
        ...form,
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        project_id: form.project_id || undefined,
        fund_id: form.fund_id || undefined,
        grant_id: form.grant_id || undefined,
        hours: Number(form.hours || 0),
      };
      if (editingId) await updateProjectTimesheet(editingId, payload);
      else await createProjectTimesheet(payload);
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: "Project timesheet saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save project timesheet." });
    }
  };

  const runAction = async (action: () => Promise<any>, success: string) => {
    try {
      await action();
      setNotice({ tone: "success", message: success });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Action failed." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Project Timesheets</h2>
        <Button variant="primary" onClick={() => { setEditingId(""); setForm(emptyForm); setShowEditor(true); }}>
          <Lucide icon="Plus" className="w-4 h-4 mr-1" />
          New Timesheet Entry
        </Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5">
        <div className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Approved entries sync into payroll run timesheet allocations for the matching payroll period. That means project time can drive payroll cost splits and, for hourly workers, payroll amount.
        </div>
        <Table className="mt-4">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Worker</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Project Coverage</Table.Th>
              <Table.Th>Hours</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Synced Run</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.worker?.full_name || "-"}</div>
                  <div className="text-xs text-slate-500">{row.description || "-"}</div>
                </Table.Td>
                <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                <Table.Td>
                  <div>{projects.find((project) => String(project.id) === String(row.project_id || ""))?.name || "No project"}</div>
                  <div className="text-xs text-slate-500">{row.fund?.name || "No fund"} · {row.grant?.name || "No grant"}</div>
                </Table.Td>
                <Table.Td>{row.hours}</Table.Td>
                <Table.Td className="capitalize">{row.status}</Table.Td>
                <Table.Td>{row.synced_run?.name || "-"}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => {
                      setEditingId(row.id);
                      setForm({
                        worker_id: row.worker_id,
                        organization_id: row.organization_id || "",
                        team_id: row.team_id || "",
                        project_id: row.project_id || "",
                        fund_id: row.fund_id || "",
                        grant_id: row.grant_id || "",
                        work_date: String(row.work_date).slice(0, 10),
                        hours: String(row.hours || ""),
                        description: row.description || "",
                        status: row.status || "draft",
                      });
                      setShowEditor(true);
                    }}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button>
                    {row.status === "draft" ? <Button size="sm" variant="outline-secondary" onClick={() => void runAction(() => submitProjectTimesheet(row.id), "Timesheet submitted.")}><Lucide icon="Send" className="w-4 h-4" /></Button> : null}
                    {row.status === "submitted" ? <Button size="sm" variant="outline-primary" onClick={() => void runAction(() => approveProjectTimesheet(row.id), "Timesheet approved and synced.")}><Lucide icon="CheckCheck" className="w-4 h-4" /></Button> : null}
                    {row.status === "submitted" ? <Button size="sm" variant="outline-danger" onClick={() => void runAction(() => rejectProjectTimesheet(row.id), "Timesheet rejected.")}><Lucide icon="XCircle" className="w-4 h-4" /></Button> : null}
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? <Table.Tr><Table.Td colSpan={7} className="text-center text-slate-500 py-10">No project timesheet entries yet.</Table.Td></Table.Tr> : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingId ? "Edit Project Timesheet Entry" : "New Project Timesheet Entry"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6"><FormLabel>Worker</FormLabel><FormSelect value={form.worker_id} onChange={(e) => setForm((prev) => ({ ...prev, worker_id: e.target.value }))}><option value="">Select worker</option>{workers.map((row) => <option key={row.id} value={row.id}>{row.full_name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Work Date</FormLabel><FormInput type="date" value={form.work_date} onChange={(e) => setForm((prev) => ({ ...prev, work_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Hours</FormLabel><FormInput type="number" value={form.hours} onChange={(e) => setForm((prev) => ({ ...prev, hours: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><FormSelect value={form.organization_id} onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}><option value="">None</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Team</FormLabel><FormSelect value={form.team_id} onChange={(e) => setForm((prev) => ({ ...prev, team_id: e.target.value }))}><option value="">None</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><FormSelect value={form.project_id} onChange={(e) => setForm((prev) => ({ ...prev, project_id: e.target.value }))}><option value="">None</option>{projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Fund</FormLabel><FormSelect value={form.fund_id} onChange={(e) => setForm((prev) => ({ ...prev, fund_id: e.target.value }))}><option value="">None</option>{funds.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Grant</FormLabel><FormSelect value={form.grant_id} onChange={(e) => setForm((prev) => ({ ...prev, grant_id: e.target.value }))}><option value="">None</option>{grants.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()}>Save</Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollTimesheetsPage;
