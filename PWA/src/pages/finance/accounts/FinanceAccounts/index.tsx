import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import Tippy from "@/components/Base/Tippy";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceAccount,
  listFinanceAccounts,
  type FinanceAccountRecord,
  updateFinanceAccount,
} from "@/services/finance";
import { formatMoney } from "@/utils/formatting";

function FinanceAccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<FinanceAccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    account_type: "bank",
    bank_name: "",
    account_name: "",
    account_number: "",
    branch_name: "",
    currency: "NGN",
    opening_balance: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const rows = await listFinanceAccounts({ is_active: true });
      setAccounts(rows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalOpeningBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.opening_balance || 0), 0),
    [accounts]
  );
  const totalCurrentBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
    [accounts]
  );
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((account) => account.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [accounts]);

  const openCreate = () => {
    setEditingAccountId("");
    setForm({
      name: "",
      code: "",
      account_type: "bank",
      bank_name: "",
      account_name: "",
      account_number: "",
      branch_name: "",
      currency: "NGN",
      opening_balance: "",
    });
    setShowAccountModal(true);
  };

  const openEdit = (account: FinanceAccountRecord) => {
    setEditingAccountId(account.id);
    setForm({
      name: account.name,
      code: account.code || "",
      account_type: account.account_type,
      bank_name: account.bank_name || "",
      account_name: account.account_name || "",
      account_number: account.account_number || "",
      branch_name: account.branch_name || "",
      currency: account.currency || "NGN",
      opening_balance: String(account.opening_balance ?? 0),
    });
    setShowAccountModal(true);
  };

  const toggleStatus = async (account: FinanceAccountRecord) => {
    try {
      setSaving(true);
      await updateFinanceAccount(account.id, {
        name: account.name,
        code: account.code || undefined,
        account_type: account.account_type as "bank" | "cash" | "wallet" | "other",
        bank_name: account.bank_name || undefined,
        account_name: account.account_name || undefined,
        account_number: account.account_number || undefined,
        branch_name: account.branch_name || undefined,
        currency: account.currency,
        opening_balance: Number(account.opening_balance || 0),
        is_active: !account.is_active,
      });
      setNotice({ tone: "success", message: account.is_active ? "Account deactivated." : "Account activated." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update account." });
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async () => {
    if (!form.name.trim()) {
      setNotice({ tone: "warning", message: "Account name is required." });
      return;
    }
    try {
      setSaving(true);
      if (editingAccountId) {
        await updateFinanceAccount(editingAccountId, {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          account_type: form.account_type as "bank" | "cash" | "wallet" | "other",
          bank_name: form.bank_name.trim() || undefined,
          account_name: form.account_name.trim() || undefined,
          account_number: form.account_number.trim() || undefined,
          branch_name: form.branch_name.trim() || undefined,
          currency: form.currency.toUpperCase(),
          opening_balance: form.opening_balance.trim() ? Number(form.opening_balance) : 0,
          is_active: true,
        });
      } else {
        await createFinanceAccount({
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          account_type: form.account_type as "bank" | "cash" | "wallet" | "other",
          bank_name: form.bank_name.trim() || undefined,
          account_name: form.account_name.trim() || undefined,
          account_number: form.account_number.trim() || undefined,
          branch_name: form.branch_name.trim() || undefined,
          currency: form.currency.toUpperCase(),
          opening_balance: form.opening_balance.trim() ? Number(form.opening_balance) : 0,
        });
      }
      setShowAccountModal(false);
      setNotice({ tone: "success", message: editingAccountId ? "Account updated." : "Account created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save account." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Accounts</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={openCreate}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Account
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Total Accounts", value: stats.total, icon: "Wallet", color: "text-primary" },
          { label: "Active", value: stats.active, icon: "CheckCircle2", color: "text-success" },
          { label: "Opening Balance", value: formatMoney(totalOpeningBalance, "-", "NGN"), icon: "TrendingUp", color: "text-warning" },
          { label: "Current Balance", value: formatMoney(totalCurrentBalance, "-", "NGN"), icon: "CircleDollarSign", color: "text-pending" },
        ].map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
            <div
              className={clsx([
                "relative zoom-in",
                "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
              ])}
            >
              <div className="p-5 box">
                <div className="flex">
                  <Lucide icon={card.icon as any} className={clsx("w-[28px] h-[28px]", card.color)} />
                </div>
                <div className="mt-6 text-2xl font-medium leading-8">{card.value}</div>
                <div className="mt-1 text-base text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="box p-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Accounts</div>
          <div className="text-sm text-slate-500">
            Active: {stats.active} | Inactive: {stats.inactive}
          </div>
        </div>
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Bank Details</Table.Th>
              <Table.Th>Currency</Table.Th>
              <Table.Th>Opening</Table.Th>
              <Table.Th>Current Balance</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {accounts.map((account) => (
              <Table.Tr key={account.id}>
                <Table.Td>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs text-slate-500">{account.code || "-"}</div>
                </Table.Td>
                <Table.Td className="capitalize">{account.account_type}</Table.Td>
                <Table.Td>
                  <div className="text-xs">
                    <div>{account.bank_name || "-"}</div>
                    <div>{account.account_name || "-"}</div>
                    <div>{account.account_number || "-"}</div>
                    <div>{account.branch_name || "-"}</div>
                  </div>
                </Table.Td>
                <Table.Td>{account.currency}</Table.Td>
                <Table.Td>{formatMoney(account.opening_balance, "-", account.currency || "NGN")}</Table.Td>
                <Table.Td>{formatMoney(account.current_balance, "-", account.currency || "NGN")}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Tippy content="View" as="div">
                      <Button size="sm" variant="outline-primary" aria-label={`View account ${account.name}`} title="View account" onClick={() => navigate(`/app/finance/accounts/${account.id}`)}>
                        <Lucide icon="Eye" className="w-4 h-4" />
                      </Button>
                    </Tippy>
                    <Tippy content="Edit" as="div">
                      <Button size="sm" variant="outline-secondary" aria-label={`Edit account ${account.name}`} title="Edit account" onClick={() => openEdit(account)}>
                        <Lucide icon="FilePenLine" className="w-4 h-4" />
                      </Button>
                    </Tippy>
                    <Tippy content={account.is_active ? "Deactivate" : "Activate"} as="div">
                      <Button size="sm" variant="outline-danger" aria-label={`${account.is_active ? "Deactivate" : "Activate"} account ${account.name}`} title={account.is_active ? "Deactivate account" : "Activate account"} onClick={() => void toggleStatus(account)} disabled={saving}>
                        <Lucide icon={account.is_active ? "UserX" : "UserCheck"} className="w-4 h-4" />
                      </Button>
                    </Tippy>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && accounts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500 py-6">No accounts yet.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showAccountModal} onClose={() => setShowAccountModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">{editingAccountId ? "Edit Account" : "Create Account"}</div>
            <div>
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Code</FormLabel>
                <FormInput value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Type</FormLabel>
                <FormSelect value={form.account_type} onChange={(e) => setForm((prev) => ({ ...prev, account_type: e.target.value }))}>
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                  <option value="other">Other</option>
                </FormSelect>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Bank Name</FormLabel>
                <FormInput value={form.bank_name} onChange={(e) => setForm((prev) => ({ ...prev, bank_name: e.target.value }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Account Name</FormLabel>
                <FormInput value={form.account_name} onChange={(e) => setForm((prev) => ({ ...prev, account_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Account Number</FormLabel>
                <FormInput value={form.account_number} onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Branch</FormLabel>
                <FormInput value={form.branch_name} onChange={(e) => setForm((prev) => ({ ...prev, branch_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Currency</FormLabel>
                <FormInput value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Opening Balance</FormLabel>
                <FormInput type="number" value={form.opening_balance} onChange={(e) => setForm((prev) => ({ ...prev, opening_balance: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => setShowAccountModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveAccount()} disabled={saving}>
              {saving ? "Saving..." : editingAccountId ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceAccountsPage;
