import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createPayrollLoan, listPayrollComponents, listPayrollLoans, listPayrollWorkers, updatePayrollLoan } from "@/services/payroll";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

const emptyForm = {
  worker_id: "",
  component_id: "",
  loan_type: "loan",
  title: "",
  principal_amount: "",
  issued_date: "",
  start_recovery_date: "",
  monthly_recovery_amount: "",
  recovery_rate: "",
  status: "active",
  notes: "",
};

function FinancePayrollLoansPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const [loanRows, workerRes, componentRows] = await Promise.all([
        listPayrollLoans(),
        listPayrollWorkers({ page: 1, per_page: 200 }),
        listPayrollComponents({ component_type: "deduction" }),
      ]);
      setRows(loanRows);
      setWorkers(workerRes.data ?? []);
      setComponents(componentRows ?? []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll loans." });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      const payload = {
        ...form,
        component_id: form.component_id || undefined,
        principal_amount: Number(form.principal_amount || 0),
        monthly_recovery_amount: form.monthly_recovery_amount ? Number(form.monthly_recovery_amount) : undefined,
        recovery_rate: form.recovery_rate ? Number(form.recovery_rate) : undefined,
      };
      if (editingId) await updatePayrollLoan(editingId, payload);
      else await createPayrollLoan(payload);
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: `Payroll ${editingId ? "loan" : "advance"} saved.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save payroll loan." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Salary Advances & Loans</h2>
        <Button variant="primary" onClick={() => { setEditingId(""); setForm(emptyForm); setShowEditor(true); }}>
          <Lucide icon="Plus" className="w-4 h-4 mr-1" />
          New Advance / Loan
        </Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Worker</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th className="text-right">Principal</Table.Th>
              <Table.Th className="text-right">Outstanding</Table.Th>
              <Table.Th>Recovery</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.worker?.full_name || "-"}</div>
                  <div className="text-xs text-slate-500">{row.title}</div>
                </Table.Td>
                <Table.Td className="capitalize">{String(row.loan_type || "").replaceAll("_", " ")}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.principal_amount)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.outstanding_amount)}</Table.Td>
                <Table.Td>{row.monthly_recovery_amount ? formatMoney(row.monthly_recovery_amount) : row.recovery_rate ? `${Number(row.recovery_rate) * 100}% of payroll` : "-"}</Table.Td>
                <Table.Td className="capitalize">{row.status}</Table.Td>
                <Table.Td className="text-right">
                  <Button size="sm" variant="outline-secondary" aria-label={`Edit ${row.loan_type === "salary_advance" ? "salary advance" : "loan"} for ${row.worker?.full_name || "worker"}`} title="Edit loan or advance" onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      worker_id: row.worker_id,
                      component_id: row.component_id || "",
                      loan_type: row.loan_type,
                      title: row.title,
                      principal_amount: String(row.principal_amount || ""),
                      issued_date: String(row.issued_date).slice(0, 10),
                      start_recovery_date: String(row.start_recovery_date).slice(0, 10),
                      monthly_recovery_amount: row.monthly_recovery_amount != null ? String(row.monthly_recovery_amount) : "",
                      recovery_rate: row.recovery_rate != null ? String(row.recovery_rate) : "",
                      status: row.status || "active",
                      notes: row.notes || "",
                    });
                    setShowEditor(true);
                  }}>
                    <Lucide icon="FilePenLine" className="w-4 h-4" />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? <Table.Tr><Table.Td colSpan={7} className="text-center text-slate-500 py-10">No salary advances or loans yet.</Table.Td></Table.Tr> : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)}>
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingId ? "Edit Advance / Loan" : "New Advance / Loan"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6"><FormLabel>Worker</FormLabel><FormSelect value={form.worker_id} onChange={(e) => setForm((prev) => ({ ...prev, worker_id: e.target.value }))}><option value="">Select worker</option>{workers.map((row) => <option key={row.id} value={row.id}>{row.full_name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Recovery Component</FormLabel><FormSelect value={form.component_id} onChange={(e) => setForm((prev) => ({ ...prev, component_id: e.target.value }))}><option value="">Auto by type</option>{components.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Type</FormLabel><FormSelect value={form.loan_type} onChange={(e) => setForm((prev) => ({ ...prev, loan_type: e.target.value }))}><option value="loan">Loan</option><option value="salary_advance">Salary Advance</option></FormSelect></div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Title</FormLabel><FormInput value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Principal</FormLabel><FormInput type="number" value={form.principal_amount} onChange={(e) => setForm((prev) => ({ ...prev, principal_amount: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Issued Date</FormLabel><FormInput type="date" value={form.issued_date} onChange={(e) => setForm((prev) => ({ ...prev, issued_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Recovery Starts</FormLabel><FormInput type="date" value={form.start_recovery_date} onChange={(e) => setForm((prev) => ({ ...prev, start_recovery_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Monthly Recovery</FormLabel><FormInput type="number" value={form.monthly_recovery_amount} onChange={(e) => setForm((prev) => ({ ...prev, monthly_recovery_amount: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Recovery Rate</FormLabel><FormInput type="number" value={form.recovery_rate} onChange={(e) => setForm((prev) => ({ ...prev, recovery_rate: e.target.value }))} placeholder="0.1" /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Status</FormLabel><FormSelect value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option></FormSelect></div>
            <div className="col-span-12"><FormLabel>Notes</FormLabel><FormTextarea rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
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

export default FinancePayrollLoansPage;
