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
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import {
  createMyProjectTimesheet,
  listMyProjectTimesheets,
  submitMyProjectTimesheet,
  updateMyProjectTimesheet,
} from "@/services/payroll";
import { formatDisplayDate } from "@/utils/formatting";

const emptyForm = {
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  work_date: "",
  hours: "",
  description: "",
};

function MyTimesheetsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const [timesheetRows, orgRows, teamRows, projectRows, fundRows, grantRows] = await Promise.all([
        listMyProjectTimesheets(),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
      ]);
      setRows(timesheetRows);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load your timesheets." });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => {
    const totalHours = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0);
    return {
      entries: rows.length,
      hours: totalHours,
      submitted: rows.filter((row) => row.status === "submitted").length,
      approved: rows.filter((row) => row.status === "approved").length,
    };
  }, [rows]);

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        project_id: form.project_id || undefined,
        fund_id: form.fund_id || undefined,
        grant_id: form.grant_id || undefined,
        hours: Number(form.hours || 0),
      };
      if (editingId) await updateMyProjectTimesheet(editingId, payload);
      else await createMyProjectTimesheet(payload);
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: `Timesheet ${editingId ? "updated" : "saved"}.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save timesheet." });
    } finally {
      setSaving(false);
    }
  };

  const submit = async (id: string) => {
    try {
      await submitMyProjectTimesheet(id);
      setNotice({ tone: "success", message: "Timesheet submitted for review." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to submit timesheet." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Project Timesheets</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingId("");
              setForm(emptyForm);
              setShowEditor(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Entry
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5"><div className="text-sm text-slate-500">Entries</div><div className="mt-2 text-2xl font-semibold">{summary.entries}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Hours Logged</div><div className="mt-2 text-2xl font-semibold">{summary.hours.toFixed(2)}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Submitted</div><div className="mt-2 text-2xl font-semibold">{summary.submitted}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Approved</div><div className="mt-2 text-2xl font-semibold">{summary.approved}</div></div>
      </div>

      <div className="box p-5 mt-5">
        <div className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Use this page to submit your project time. Approved entries feed payroll allocation for project, fund, and grant costing. Draft and rejected rows can be edited; submitted rows wait for review.
        </div>
        <Table className="mt-4">
          <Table.Thead>
            <Table.Tr>
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
                  <div className="font-medium">{formatDisplayDate(row.work_date)}</div>
                  <div className="text-xs text-slate-500">{row.description || "-"}</div>
                </Table.Td>
                <Table.Td>
                  <div>{projects.find((project) => String(project.id) === String(row.project_id || ""))?.name || "No project"}</div>
                  <div className="text-xs text-slate-500">{row.fund?.name || "No fund"} · {row.grant?.name || "No grant"}</div>
                </Table.Td>
                <Table.Td>{row.hours}</Table.Td>
                <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                <Table.Td>{row.synced_run?.name || "-"}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    {["draft", "rejected"].includes(row.status) ? (
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        aria-label={`Edit timesheet entry for ${formatDisplayDate(row.work_date)}`}
                        title="Edit timesheet entry"
                        onClick={() => {
                          setEditingId(row.id);
                          setForm({
                            organization_id: row.organization_id || "",
                            team_id: row.team_id || "",
                            project_id: row.project_id || "",
                            fund_id: row.fund_id || "",
                            grant_id: row.grant_id || "",
                            work_date: String(row.work_date).slice(0, 10),
                            hours: String(row.hours || ""),
                            description: row.description || "",
                          });
                          setShowEditor(true);
                        }}
                      >
                        <Lucide icon="FilePenLine" className="w-4 h-4" />
                      </Button>
                    ) : null}
                    {["draft", "rejected"].includes(row.status) ? (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        aria-label={`Submit timesheet entry for ${formatDisplayDate(row.work_date)}`}
                        title="Submit timesheet entry"
                        onClick={() => void submit(row.id)}
                      >
                        <Lucide icon="Send" className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-10">No timesheet entries yet.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingId ? "Edit Timesheet Entry" : "New Timesheet Entry"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4"><FormLabel>Work Date</FormLabel><FormInput type="date" value={form.work_date} onChange={(e) => setForm((prev) => ({ ...prev, work_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Hours</FormLabel><FormInput type="number" value={form.hours} onChange={(e) => setForm((prev) => ({ ...prev, hours: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><TomSelect value={form.organization_id} onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}><option value="">None</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Team</FormLabel><TomSelect value={form.team_id} onChange={(e) => setForm((prev) => ({ ...prev, team_id: e.target.value }))}><option value="">None</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><TomSelect value={form.project_id} onChange={(e) => setForm((prev) => ({ ...prev, project_id: e.target.value }))}><option value="">None</option>{projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Fund</FormLabel><TomSelect value={form.fund_id} onChange={(e) => setForm((prev) => ({ ...prev, fund_id: e.target.value }))}><option value="">None</option>{funds.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Grant</FormLabel><TomSelect value={form.grant_id} onChange={(e) => setForm((prev) => ({ ...prev, grant_id: e.target.value }))}><option value="">None</option>{grants.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</TomSelect></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default MyTimesheetsPage;
