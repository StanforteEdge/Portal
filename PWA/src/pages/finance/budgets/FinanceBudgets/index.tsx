import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceBudget,
  listFinanceBudgets,
  listFinanceFunds,
  listFinanceGrants,
  updateFinanceBudget,
} from "@/services/financeAccounting";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { listProjects } from "@/services/projects";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

const emptyForm = {
  name: "",
  budget_type: "project",
  currency: "NGN",
  start_date: "",
  end_date: "",
  status: "draft",
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  notes: "",
  lines: [{ line_label: "", amount: "" }],
};

function FinanceBudgetsPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ budget_type: "", status: "" });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.budget_type ? { budget_type: filters.budget_type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      };
      const [budgetRows, orgRows, teamRows, projectRows, fundRows, grantRows] = await Promise.all([
        listFinanceBudgets(params),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
      ]);
      setBudgets(budgetRows);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load budgets." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, row) => sum + Number(row.total_budget || 0), 0);
    return {
      totalBudget,
      approvedCount: budgets.filter((row) => row.status === "approved").length,
      grantCount: budgets.filter((row) => row.budget_type === "grant").length,
      fundCount: budgets.filter((row) => row.budget_type === "fund").length,
    };
  }, [budgets]);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      budget_type: row.budget_type || "project",
      currency: row.currency || "NGN",
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
      end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
      status: row.status || "draft",
      organization_id: row.organization_id || "",
      team_id: row.team_id || "",
      project_id: row.project_id || "",
      fund_id: row.fund?.id || "",
      grant_id: row.grant?.id || "",
      notes: row.notes || "",
      lines: (row.lines || []).length
        ? row.lines.map((line: any) => ({
            line_label: line.line_label || "",
            amount: String(line.amount ?? ""),
          }))
        : [{ line_label: "", amount: "" }],
    });
    setShowEditor(true);
  };

  const saveBudget = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        project_id: form.project_id || undefined,
        fund_id: form.fund_id || undefined,
        grant_id: form.grant_id || undefined,
        lines: (form.lines || [])
          .filter((line: any) => line.line_label?.trim() || Number(line.amount || 0) > 0)
          .map((line: any, index: number) => ({
            line_label: String(line.line_label || "").trim(),
            amount: Number(line.amount || 0),
            sort_order: index,
          })),
      };
      if (editingId) {
        await updateFinanceBudget(editingId, payload);
      } else {
        await createFinanceBudget(payload);
      }
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: `Budget ${editingId ? "updated" : "created"} successfully.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save budget." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Budgets</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Budget
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Total Budgets</div>
          <div className="text-2xl font-medium mt-2">{budgets.length}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Budget Value</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(totals.totalBudget)}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Approved</div>
          <div className="text-2xl font-medium mt-2">{totals.approvedCount}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Fund / Grant Budgets</div>
          <div className="text-2xl font-medium mt-2">{totals.fundCount + totals.grantCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-4">
          <FormLabel>Budget Type</FormLabel>
          <FormSelect value={filters.budget_type} onChange={(e) => setFilters((prev) => ({ ...prev, budget_type: e.target.value }))}>
            <option value="">All types</option>
            <option value="project">Project</option>
            <option value="fund">Fund</option>
            <option value="grant">Grant</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-4">
          <FormLabel>Status</FormLabel>
          <FormSelect value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-4 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" /> Apply Filters
          </Button>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Budget</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {budgets.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500 uppercase">{row.budget_type}</div>
                </Table.Td>
                <Table.Td>
                  {row.grant?.name || row.fund?.name || projects.find((project) => project.id === row.project_id)?.name || "General"}
                </Table.Td>
                <Table.Td>
                  {formatDisplayDate(row.start_date)} - {formatDisplayDate(row.end_date)}
                </Table.Td>
                <Table.Td>{row.status}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.total_budget)}</Table.Td>
                <Table.Td className="text-right">
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>
                    <Lucide icon="FilePenLine" className="w-4 h-4" />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!budgets.length ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-10">
                  No budgets found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingId ? "Edit Budget" : "New Budget"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Budget Type</FormLabel>
              <FormSelect value={form.budget_type} onChange={(e) => setForm((prev: any) => ({ ...prev, budget_type: e.target.value, project_id: "", fund_id: "", grant_id: "" }))}>
                <option value="project">Project</option>
                <option value="fund">Fund</option>
                <option value="grant">Grant</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(e) => setForm((prev: any) => ({ ...prev, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="closed">Closed</option>
              </FormSelect>
            </div>

            <div className="col-span-12 md:col-span-3">
              <FormLabel>Currency</FormLabel>
              <FormInput value={form.currency} onChange={(e) => setForm((prev: any) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Start Date</FormLabel>
              <FormInput type="date" value={form.start_date} onChange={(e) => setForm((prev: any) => ({ ...prev, start_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>End Date</FormLabel>
              <FormInput type="date" value={form.end_date} onChange={(e) => setForm((prev: any) => ({ ...prev, end_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={form.organization_id} onChange={(e) => setForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>

            <div className="col-span-12 md:col-span-4">
              <FormLabel>Team</FormLabel>
              <FormSelect value={form.team_id} onChange={(e) => setForm((prev: any) => ({ ...prev, team_id: e.target.value }))}>
                <option value="">Optional</option>
                {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            {form.budget_type === "project" ? (
              <div className="col-span-12 md:col-span-8">
                <FormLabel>Project</FormLabel>
                <FormSelect value={form.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, project_id: e.target.value }))}>
                  <option value="">Select project</option>
                  {projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                </FormSelect>
              </div>
            ) : null}
            {form.budget_type === "fund" ? (
              <div className="col-span-12 md:col-span-8">
                <FormLabel>Fund</FormLabel>
                <FormSelect value={form.fund_id} onChange={(e) => setForm((prev: any) => ({ ...prev, fund_id: e.target.value }))}>
                  <option value="">Select fund</option>
                  {funds.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
                </FormSelect>
              </div>
            ) : null}
            {form.budget_type === "grant" ? (
              <>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Fund</FormLabel>
                  <FormSelect value={form.fund_id} onChange={(e) => setForm((prev: any) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}>
                    <option value="">Optional fund</option>
                    {funds.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-8">
                  <FormLabel>Grant</FormLabel>
                  <FormSelect value={form.grant_id} onChange={(e) => setForm((prev: any) => ({ ...prev, grant_id: e.target.value }))}>
                    <option value="">Select grant</option>
                    {grants
                      .filter((row) => !form.fund_id || row.fund?.id === form.fund_id)
                      .map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
                  </FormSelect>
                </div>
              </>
            ) : null}

            <div className="col-span-12">
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Budget Lines</FormLabel>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setForm((prev: any) => ({ ...prev, lines: [...prev.lines, { line_label: "", amount: "" }] }))}
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Line
                </Button>
              </div>
              <div className="space-y-3">
                {(form.lines || []).map((line: any, index: number) => (
                  <div key={`${index}-${line.line_label}`} className="grid grid-cols-12 gap-3 items-end border rounded-md p-3">
                    <div className="col-span-12 md:col-span-8">
                      <FormLabel>Line Item</FormLabel>
                      <FormInput
                        value={line.line_label}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            lines: prev.lines.map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, line_label: e.target.value } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-10 md:col-span-3">
                      <FormLabel>Amount</FormLabel>
                      <FormInput
                        type="number"
                        value={line.amount}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            lines: prev.lines.map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, amount: e.target.value } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          setForm((prev: any) => ({
                            ...prev,
                            lines: prev.lines.filter((_: any, entryIndex: number) => entryIndex !== index) || [],
                          }))
                        }
                        disabled={(form.lines || []).length <= 1}
                      >
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={form.notes} onChange={(e) => setForm((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)} className="mr-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveBudget()} disabled={saving}>
              <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" /> {saving ? "Saving..." : editingId ? "Save Changes" : "Create Budget"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceBudgetsPage;
