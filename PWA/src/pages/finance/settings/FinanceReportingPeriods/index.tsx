import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { closeFinanceReportingPeriod, createFinanceReportingPeriod, listFinanceReportingPeriods, reopenFinanceReportingPeriod, updateFinanceReportingPeriod } from "@/services/financeAccounting";
import { formatDisplayDate } from "@/utils/formatting";

const today = new Date();
const emptyForm = {
  year: String(today.getFullYear()),
  month: String(today.getMonth() + 1),
  start_date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
  end_date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, "0")}`,
  status: "open",
  notes: "",
};

function FinanceReportingPeriodsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      setRows(await listFinanceReportingPeriods());
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load reporting periods." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openEdit = (row?: any) => {
    if (!row) {
      setEditingId("");
      setForm(emptyForm);
    } else {
      setEditingId(row.id);
      setForm({ year: String(row.year), month: String(row.month), start_date: String(row.start_date).slice(0, 10), end_date: String(row.end_date).slice(0, 10), status: row.status, notes: row.notes || "" });
    }
    setShowModal(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = { ...form, year: Number(form.year), month: Number(form.month) };
      if (editingId) await updateFinanceReportingPeriod(editingId, payload);
      else await createFinanceReportingPeriod(payload);
      setShowModal(false);
      setNotice({ tone: "success", message: editingId ? "Reporting period updated." : "Reporting period created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save reporting period." });
    } finally { setSaving(false); }
  };

  const toggleStatus = async (row: any) => {
    try {
      if (row.status === "closed") await reopenFinanceReportingPeriod(row.id);
      else await closeFinanceReportingPeriod(row.id);
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update reporting period." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y"><h2 className="mr-auto text-lg font-medium">Reporting Periods</h2><div className="flex gap-2"><Button variant="primary" onClick={() => openEdit()}><Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Period</Button><Button variant="outline-secondary" onClick={() => void load()} disabled={loading}><Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh</Button></div></div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead><Table.Tr><Table.Th>Label</Table.Th><Table.Th>Year</Table.Th><Table.Th>Month</Table.Th><Table.Th>Quarter</Table.Th><Table.Th>Start</Table.Th><Table.Th>End</Table.Th><Table.Th>Status</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{rows.map((row) => <Table.Tr key={row.id}><Table.Td className="font-medium">{row.label}</Table.Td><Table.Td>{row.year}</Table.Td><Table.Td>{row.month}</Table.Td><Table.Td>Q{row.quarter}</Table.Td><Table.Td>{formatDisplayDate(row.start_date)}</Table.Td><Table.Td>{formatDisplayDate(row.end_date)}</Table.Td><Table.Td><span className={row.status === "closed" ? "text-danger" : "text-success"}>{row.status}</span></Table.Td><Table.Td className="text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button><Button size="sm" variant="outline-primary" onClick={() => void toggleStatus(row)}>{row.status === "closed" ? "Reopen" : "Close"}</Button></div></Table.Td></Table.Tr>)}</Table.Tbody>
        </Table>
      </div>
      <Dialog open={showModal} onClose={() => !saving && setShowModal(false)}><Dialog.Panel className="p-5"><div className="text-lg font-medium">{editingId ? "Edit" : "New"} Reporting Period</div><div className="grid grid-cols-12 gap-4 mt-5"><div className="col-span-12 md:col-span-3"><FormLabel>Year</FormLabel><FormInput type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} /></div><div className="col-span-12 md:col-span-3"><FormLabel>Month</FormLabel><FormSelect value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}>{Array.from({ length: 12 }, (_, idx) => <option key={idx + 1} value={idx + 1}>{idx + 1}</option>)}</FormSelect></div><div className="col-span-12 md:col-span-3"><FormLabel>Start Date</FormLabel><FormInput type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div><div className="col-span-12 md:col-span-3"><FormLabel>End Date</FormLabel><FormInput type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} /></div><div className="col-span-12 md:col-span-4"><FormLabel>Status</FormLabel><FormSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="open">Open</option><option value="closed">Closed</option></FormSelect></div><div className="col-span-12 md:col-span-8"><FormLabel>Notes</FormLabel><FormInput value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div></div><div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div></Dialog.Panel></Dialog>
    </>
  );
}

export default FinanceReportingPeriodsPage;
