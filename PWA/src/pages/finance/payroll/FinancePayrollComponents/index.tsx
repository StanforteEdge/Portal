import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createPayrollComponent, listPayrollComponents, updatePayrollComponent } from "@/services/payroll";
import { listFinanceChartAccounts } from "@/services/financeAccounting";

const emptyForm = {
  chart_account_id: "",
  code: "",
  name: "",
  component_type: "earning",
  calculation_type: "fixed",
  paid_by: "employee",
  employer_share_percent: "0",
  is_taxable: "false",
  affects_net_pay: "true",
  is_statutory: "false",
  is_active: "true",
};

function FinancePayrollComponentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [chartAccounts, setChartAccounts] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const [components, accounts] = await Promise.all([
        listPayrollComponents(),
        listFinanceChartAccounts({ is_active: true }).catch(() => []),
      ]);
      setRows(components);
      setChartAccounts(accounts);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll components." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        chart_account_id: form.chart_account_id || undefined,
        code: form.code,
        name: form.name,
        component_type: form.component_type,
        calculation_type: form.calculation_type,
        paid_by: form.paid_by,
        employer_share_percent: Number(form.employer_share_percent || 0),
        is_taxable: form.is_taxable === "true",
        affects_net_pay: form.affects_net_pay === "true",
        is_statutory: form.is_statutory === "true",
        is_active: form.is_active === "true",
      };
      if (editingId) {
        await updatePayrollComponent(editingId, payload);
      } else {
        await createPayrollComponent(payload);
      }
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: `Payroll component ${editingId ? "updated" : "created"} successfully.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save payroll component." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Components</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
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
            New Component
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Chart Account</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.code}</Table.Td>
                <Table.Td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">
                    {row.is_statutory ? "Statutory" : "Operational"} • {row.is_taxable ? "Taxable" : "Non-taxable"} • Paid by {row.paid_by || "employee"}
                  </div>
                </Table.Td>
                <Table.Td className="capitalize">{row.component_type.replaceAll("_", " ")}</Table.Td>
                <Table.Td>{row.chart_account ? `${row.chart_account.code} - ${row.chart_account.name}` : "-"}</Table.Td>
                <Table.Td className="text-right">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      setEditingId(row.id);
                      setForm({
                        chart_account_id: row.chart_account_id || "",
                        code: row.code || "",
                        name: row.name || "",
                        component_type: row.component_type || "earning",
                        calculation_type: row.calculation_type || "fixed",
                        paid_by: row.paid_by || "employee",
                        employer_share_percent: String(row.employer_share_percent ?? 0),
                        is_taxable: String(Boolean(row.is_taxable)),
                        affects_net_pay: String(Boolean(row.affects_net_pay ?? true)),
                        is_statutory: String(Boolean(row.is_statutory)),
                        is_active: String(Boolean(row.is_active)),
                      });
                      setShowEditor(true);
                    }}
                  >
                    <Lucide icon="FilePenLine" className="w-4 h-4" />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center text-slate-500 py-10">
                  No payroll components found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)}>
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingId ? "Edit Payroll Component" : "New Payroll Component"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Code</FormLabel>
              <FormInput value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Type</FormLabel>
              <FormSelect value={form.component_type} onChange={(e) => setForm((prev) => ({ ...prev, component_type: e.target.value }))}>
                <option value="earning">Earning</option>
                <option value="deduction">Deduction</option>
                <option value="employer_cost">Employer Cost</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Calculation</FormLabel>
              <FormSelect value={form.calculation_type} onChange={(e) => setForm((prev) => ({ ...prev, calculation_type: e.target.value }))}>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
                <option value="formula">Formula</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Paid By</FormLabel>
              <FormSelect value={form.paid_by} onChange={(e) => setForm((prev) => ({ ...prev, paid_by: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="employer">Employer</option>
                <option value="shared">Shared</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Chart Account</FormLabel>
              <FormSelect value={form.chart_account_id} onChange={(e) => setForm((prev) => ({ ...prev, chart_account_id: e.target.value }))}>
                <option value="">Select chart account</option>
                {chartAccounts.map((row) => (
                  <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Taxable</FormLabel>
              <FormSelect value={form.is_taxable} onChange={(e) => setForm((prev) => ({ ...prev, is_taxable: e.target.value }))}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Affects Net Pay</FormLabel>
              <FormSelect value={form.affects_net_pay} onChange={(e) => setForm((prev) => ({ ...prev, affects_net_pay: e.target.value }))}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Employer Share %</FormLabel>
              <FormInput type="number" value={form.employer_share_percent} onChange={(e) => setForm((prev) => ({ ...prev, employer_share_percent: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Statutory</FormLabel>
              <FormSelect value={form.is_statutory} onChange={(e) => setForm((prev) => ({ ...prev, is_statutory: e.target.value }))}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Active</FormLabel>
              <FormSelect value={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value }))}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </FormSelect>
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : "Save Component"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollComponentsPage;
