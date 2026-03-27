import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceChartAccounts } from "@/services/financeAccounting";
import { getPayrollSettings, updatePayrollSettings } from "@/services/payroll";

function FinancePayrollSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({
    default_expense_account_id: "",
    default_cash_account_id: "",
    employee_tax_rate: "0",
    employee_pension_rate: "0",
    employer_pension_rate: "0",
    consultant_withholding_rate: "0",
    consultant_pension_rate: "0",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [settings, chartAccounts] = await Promise.all([
        getPayrollSettings(),
        listFinanceChartAccounts().catch(() => []),
      ]);
      setAccounts(chartAccounts || []);
      setForm({
        default_expense_account_id: settings?.default_expense_account_id || "",
        default_cash_account_id: settings?.default_cash_account_id || "",
        employee_tax_rate: String(settings?.config?.employee_tax_rate ?? 0),
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
        config: {
          employee_tax_rate: Number(form.employee_tax_rate || 0),
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
        <div className="font-medium">Statutory Rates</div>
        <div className="text-sm text-slate-500 mt-1">Use decimal rates. Example: 0.08 means 8%.</div>
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <FormLabel>Employee Tax Rate</FormLabel>
            <FormInput value={form.employee_tax_rate} onChange={(e) => setForm((prev) => ({ ...prev, employee_tax_rate: e.target.value }))} />
          </div>
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
    </>
  );
}

export default FinancePayrollSettingsPage;
