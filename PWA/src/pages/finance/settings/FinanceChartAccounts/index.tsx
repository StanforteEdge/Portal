import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createFinanceChartAccount, listFinanceChartAccounts, updateFinanceChartAccount } from "@/services/financeAccounting";

const emptyForm = {
  code: "",
  name: "",
  type: "asset",
  category: "bank",
  normal_balance: "debit",
  is_control_account: false,
  is_active: true,
};

function FinanceChartAccountsPage() {
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
      setRows(await listFinanceChartAccounts());
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load chart accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      type: row.type,
      category: row.category,
      normal_balance: row.normal_balance,
      is_control_account: row.is_control_account,
      is_active: row.is_active,
    });
    setShowModal(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = { ...form, code: form.code.trim().toUpperCase(), name: form.name.trim(), category: form.category.trim().toLowerCase() };
      if (editingId) await updateFinanceChartAccount(editingId, payload);
      else await createFinanceChartAccount(payload);
      setShowModal(false);
      setNotice({ tone: "success", message: editingId ? "Chart account updated." : "Chart account created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save chart account." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Chart of Accounts</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={openCreate}><Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Account</Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}><Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr><Table.Th>Code</Table.Th><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th>Category</Table.Th><Table.Th>Normal</Table.Th><Table.Th>Linked Account</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.code}</Table.Td>
                <Table.Td>
                  <div className="font-medium">{row.name}</div>
                  {row.is_control_account ? <div className="text-xs text-primary">Control account</div> : null}
                </Table.Td>
                <Table.Td className="capitalize">{row.type}</Table.Td>
                <Table.Td>{row.category}</Table.Td>
                <Table.Td className="capitalize">{row.normal_balance}</Table.Td>
                <Table.Td>{row.finance_account?.name || "-"}</Table.Td>
                <Table.Td className="text-right"><Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      <Dialog open={showModal} onClose={() => !saving && setShowModal(false)}>
        <Dialog.Panel className="p-5">
          <div className="text-lg font-medium">{editingId ? "Edit" : "New"} Chart Account</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4"><FormLabel>Code</FormLabel><FormInput value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Name</FormLabel><FormInput value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Type</FormLabel><FormSelect value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Category</FormLabel><FormInput value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Normal Balance</FormLabel><FormSelect value={form.normal_balance} onChange={(e) => setForm((p) => ({ ...p, normal_balance: e.target.value }))}><option value="debit">Debit</option><option value="credit">Credit</option></FormSelect></div>
            <div className="col-span-12 md:col-span-6"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_control_account} onChange={(e) => setForm((p) => ({ ...p, is_control_account: e.target.checked }))} /> Control account</label></div>
            <div className="col-span-12 md:col-span-6"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} /> Active</label></div>
          </div>
          <div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceChartAccountsPage;
