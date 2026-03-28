import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceChartAccounts } from "@/services/financeAccounting";
import {
  createPayrollTaxTable,
  getPayrollSettings,
  listPayrollTaxTables,
  updatePayrollSettings,
  updatePayrollTaxTable,
} from "@/services/payroll";

const emptyBand = { lower_bound: "0", upper_bound: "", rate: "" };
const emptyTaxTableForm = {
  name: "",
  code: "",
  worker_type: "employee",
  periodicity: "monthly",
  status: "active",
  effective_from: "",
  effective_to: "",
  fixed_relief_amount: "0",
  gross_relief_rate: "0",
  minimum_relief_amount: "0",
  pension_relief_enabled: true,
  bands: [{ ...emptyBand }],
};

function FinancePayrollSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTaxTable, setSavingTaxTable] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [taxTables, setTaxTables] = useState<any[]>([]);
  const [showTaxTableEditor, setShowTaxTableEditor] = useState(false);
  const [editingTaxTableId, setEditingTaxTableId] = useState("");
  const [taxTableForm, setTaxTableForm] = useState<any>(emptyTaxTableForm);
  const [form, setForm] = useState({
    default_expense_account_id: "",
    default_cash_account_id: "",
    employee_tax_table_id: "",
    employee_pension_rate: "0",
    employer_pension_rate: "0",
    consultant_withholding_rate: "0",
    consultant_pension_rate: "0",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [settings, chartAccounts, taxTableRows] = await Promise.all([
        getPayrollSettings(),
        listFinanceChartAccounts().catch(() => []),
        listPayrollTaxTables().catch(() => []),
      ]);
      setAccounts(chartAccounts || []);
      setTaxTables(taxTableRows || []);
      setForm({
        default_expense_account_id: settings?.default_expense_account_id || "",
        default_cash_account_id: settings?.default_cash_account_id || "",
        employee_tax_table_id: settings?.employee_tax_table_id || "",
        employee_pension_rate: String(settings?.config?.employee_pension_rate ?? 0),
        employer_pension_rate: String(settings?.config?.employer_pension_rate ?? 0),
        consultant_withholding_rate: String(settings?.config?.consultant_withholding_rate ?? 0),
        consultant_pension_rate: String(settings?.config?.consultant_pension_rate ?? 0),
      });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll settings." });
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
      await updatePayrollSettings({
        default_expense_account_id: form.default_expense_account_id || undefined,
        default_cash_account_id: form.default_cash_account_id || undefined,
        employee_tax_table_id: form.employee_tax_table_id || undefined,
        config: {
          employee_pension_rate: Number(form.employee_pension_rate || 0),
          employer_pension_rate: Number(form.employer_pension_rate || 0),
          consultant_withholding_rate: Number(form.consultant_withholding_rate || 0),
          consultant_pension_rate: Number(form.consultant_pension_rate || 0),
        },
      });
      setNotice({ tone: "success", message: "Payroll settings updated." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update payroll settings." });
    } finally {
      setSaving(false);
    }
  };

  const openTaxTableEditor = (row?: any) => {
    setEditingTaxTableId(row?.id || "");
    setTaxTableForm(
      row
        ? {
            name: row.name || "",
            code: row.code || "",
            worker_type: row.worker_type || "employee",
            periodicity: row.periodicity || "monthly",
            status: row.status || "active",
            effective_from: row.effective_from ? String(row.effective_from).slice(0, 10) : "",
            effective_to: row.effective_to ? String(row.effective_to).slice(0, 10) : "",
            fixed_relief_amount: String(row.fixed_relief_amount ?? 0),
            gross_relief_rate: String(row.gross_relief_rate ?? 0),
            minimum_relief_amount: String(row.minimum_relief_amount ?? 0),
            pension_relief_enabled: row.pension_relief_enabled !== false,
            bands:
              row.bands?.length > 0
                ? row.bands.map((band: any) => ({
                    lower_bound: String(band.lower_bound ?? 0),
                    upper_bound: band.upper_bound == null ? "" : String(band.upper_bound),
                    rate: String(band.rate ?? ""),
                  }))
                : [{ ...emptyBand }],
          }
        : {
            ...emptyTaxTableForm,
            effective_from: new Date().toISOString().slice(0, 10),
            bands: [{ ...emptyBand }],
          }
    );
    setShowTaxTableEditor(true);
  };

  const saveTaxTable = async () => {
    try {
      setSavingTaxTable(true);
      const payload = {
        ...taxTableForm,
        effective_to: taxTableForm.effective_to || undefined,
        fixed_relief_amount: Number(taxTableForm.fixed_relief_amount || 0),
        gross_relief_rate: Number(taxTableForm.gross_relief_rate || 0),
        minimum_relief_amount: Number(taxTableForm.minimum_relief_amount || 0),
        bands: (taxTableForm.bands || [])
          .filter((band: any) => Number(band.rate || 0) > 0)
          .map((band: any, index: number) => ({
            lower_bound: Number(band.lower_bound || 0),
            upper_bound: band.upper_bound === "" ? null : Number(band.upper_bound),
            rate: Number(band.rate || 0),
            sort_order: index,
          })),
      };
      if (editingTaxTableId) await updatePayrollTaxTable(editingTaxTableId, payload);
      else await createPayrollTaxTable(payload);
      setShowTaxTableEditor(false);
      setEditingTaxTableId("");
      setTaxTableForm(emptyTaxTableForm);
      setNotice({ tone: "success", message: `Tax table ${editingTaxTableId ? "updated" : "created"}.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save tax table." });
    } finally {
      setSavingTaxTable(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Settings</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="font-medium">Default Accounts</div>
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <FormLabel>Default Expense Account</FormLabel>
            <FormSelect value={form.default_expense_account_id} onChange={(e) => setForm((prev) => ({ ...prev, default_expense_account_id: e.target.value }))}>
              <option value="">Select account</option>
              {accounts.map((row) => (
                <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Default Cash / Bank Chart Account</FormLabel>
            <FormSelect value={form.default_cash_account_id} onChange={(e) => setForm((prev) => ({ ...prev, default_cash_account_id: e.target.value }))}>
              <option value="">Select account</option>
              {accounts.map((row) => (
                <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">PAYE Rule Tables</div>
            <div className="text-sm text-slate-500 mt-1">Use progressive tax bands and relief rules instead of a flat employee tax rate.</div>
          </div>
          <Button variant="outline-primary" onClick={() => openTaxTableEditor()}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Tax Table
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <FormLabel>Default Employee PAYE Table</FormLabel>
            <FormSelect value={form.employee_tax_table_id} onChange={(e) => setForm((prev) => ({ ...prev, employee_tax_table_id: e.target.value }))}>
              <option value="">None selected</option>
              {taxTables
                .filter((row) => ["employee", "all"].includes(String(row.worker_type || "employee")))
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} ({row.periodicity})
                  </option>
                ))}
            </FormSelect>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {taxTables.length ? taxTables.map((row) => (
            <div key={row.id} className="rounded border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">
                    {row.code} · {String(row.worker_type || "").replaceAll("_", " ")} · {row.periodicity} · {row.status}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Relief: fixed {row.fixed_relief_amount} + {(Number(row.gross_relief_rate || 0) * 100).toFixed(2)}% of gross, minimum {row.minimum_relief_amount}
                  </div>
                </div>
                <Button size="sm" variant="outline-secondary" onClick={() => openTaxTableEditor(row)}>
                  <Lucide icon="FilePenLine" className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Lower Bound</th>
                      <th className="pb-2">Upper Bound</th>
                      <th className="pb-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(row.bands || []).map((band: any, index: number) => (
                      <tr key={`${row.id}-band-${index}`} className="border-t">
                        <td className="py-2">{band.lower_bound}</td>
                        <td className="py-2">{band.upper_bound ?? "No cap"}</td>
                        <td className="py-2">{(Number(band.rate || 0) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )) : (
            <div className="rounded border border-dashed px-4 py-8 text-center text-slate-500">
              No PAYE rule tables yet.
            </div>
          )}
        </div>
      </div>

      <div className="box p-5 mt-5">
        <div className="font-medium">Other Statutory Rates</div>
        <div className="text-sm text-slate-500 mt-1">Use decimal rates. Example: 0.08 means 8%.</div>
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <FormLabel>Employee Pension Rate</FormLabel>
            <FormInput value={form.employee_pension_rate} onChange={(e) => setForm((prev) => ({ ...prev, employee_pension_rate: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Employer Pension Rate</FormLabel>
            <FormInput value={form.employer_pension_rate} onChange={(e) => setForm((prev) => ({ ...prev, employer_pension_rate: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Consultant Withholding Rate</FormLabel>
            <FormInput value={form.consultant_withholding_rate} onChange={(e) => setForm((prev) => ({ ...prev, consultant_withholding_rate: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Consultant Pension Rate</FormLabel>
            <FormInput value={form.consultant_pension_rate} onChange={(e) => setForm((prev) => ({ ...prev, consultant_pension_rate: e.target.value }))} />
          </div>
        </div>
      </div>

      <Dialog open={showTaxTableEditor} onClose={() => setShowTaxTableEditor(false)} size="xl">
        <Dialog.Panel className="max-h-[92vh] overflow-y-auto">
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingTaxTableId ? "Edit PAYE Rule Table" : "New PAYE Rule Table"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6"><FormLabel>Name</FormLabel><FormInput value={taxTableForm.name} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Code</FormLabel><FormInput value={taxTableForm.code} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, code: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Worker Type</FormLabel><FormSelect value={taxTableForm.worker_type} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, worker_type: e.target.value }))}><option value="employee">Employee</option><option value="all">All Workers</option><option value="consultant">Consultant</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Periodicity</FormLabel><FormSelect value={taxTableForm.periodicity} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, periodicity: e.target.value }))}><option value="monthly">Monthly</option><option value="annual">Annual</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Status</FormLabel><FormSelect value={taxTableForm.status} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Effective From</FormLabel><FormInput type="date" value={taxTableForm.effective_from} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, effective_from: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Effective To</FormLabel><FormInput type="date" value={taxTableForm.effective_to} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, effective_to: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4 flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={taxTableForm.pension_relief_enabled} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, pension_relief_enabled: e.target.checked }))} />
                Pension gives tax relief
              </label>
            </div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Fixed Relief Amount</FormLabel><FormInput type="number" value={taxTableForm.fixed_relief_amount} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, fixed_relief_amount: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Gross Relief Rate</FormLabel><FormInput type="number" value={taxTableForm.gross_relief_rate} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, gross_relief_rate: e.target.value }))} placeholder="0.20" /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Minimum Relief Amount</FormLabel><FormInput type="number" value={taxTableForm.minimum_relief_amount} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, minimum_relief_amount: e.target.value }))} /></div>
            <div className="col-span-12">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">Tax Bands</div>
                  <div className="text-xs text-slate-500">Bands are evaluated progressively from lower bound upward.</div>
                </div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setTaxTableForm((prev: any) => ({ ...prev, bands: [...(prev.bands || []), { ...emptyBand }] }))}
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                  Add Band
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {(taxTableForm.bands || []).map((band: any, index: number) => (
                  <div key={`band-${index}`} className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-4"><FormLabel>Lower Bound</FormLabel><FormInput type="number" value={band.lower_bound} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, bands: prev.bands.map((entry: any, i: number) => i === index ? { ...entry, lower_bound: e.target.value } : entry) }))} /></div>
                    <div className="col-span-12 md:col-span-4"><FormLabel>Upper Bound</FormLabel><FormInput type="number" value={band.upper_bound} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, bands: prev.bands.map((entry: any, i: number) => i === index ? { ...entry, upper_bound: e.target.value } : entry) }))} placeholder="Leave blank for final band" /></div>
                    <div className="col-span-10 md:col-span-3"><FormLabel>Rate</FormLabel><FormInput type="number" value={band.rate} onChange={(e) => setTaxTableForm((prev: any) => ({ ...prev, bands: prev.bands.map((entry: any, i: number) => i === index ? { ...entry, rate: e.target.value } : entry) }))} placeholder="0.07" /></div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <Button variant="outline-danger" className="w-full" onClick={() => setTaxTableForm((prev: any) => ({ ...prev, bands: prev.bands.filter((_: unknown, i: number) => i !== index) }))}>
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowTaxTableEditor(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveTaxTable()} disabled={savingTaxTable}>{savingTaxTable ? "Saving..." : "Save Tax Table"}</Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollSettingsPage;
