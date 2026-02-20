import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceAccount,
  createFinanceIncome,
  listFinanceAccounts,
  listFinanceLedger,
  type FinanceAccountRecord,
  type FinanceLedgerRecord,
} from "@/services/finance";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceAccountsPage() {
  const [accounts, setAccounts] = useState<FinanceAccountRecord[]>([]);
  const [recentLedger, setRecentLedger] = useState<FinanceLedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [accountForm, setAccountForm] = useState({
    name: "",
    code: "",
    account_type: "bank",
    currency: "NGN",
    opening_balance: "",
  });

  const [incomeForm, setIncomeForm] = useState({
    account_id: "",
    amount: "",
    currency: "NGN",
    reference: "",
    payer: "",
    notes: "",
    received_at: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [accountRows, ledgerRows] = await Promise.all([
        listFinanceAccounts({ is_active: true }),
        listFinanceLedger({ limit: 10 }),
      ]);
      setAccounts(accountRows);
      setRecentLedger(ledgerRows);
      if (!incomeForm.account_id && accountRows[0]?.id) {
        setIncomeForm((prev) => ({ ...prev, account_id: accountRows[0].id }));
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load finance accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalOpeningBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.opening_balance || 0), 0),
    [accounts]
  );

  const submitAccount = async () => {
    if (!accountForm.name.trim()) {
      setNotice({ tone: "warning", message: "Account name is required." });
      return;
    }
    try {
      setSavingAccount(true);
      await createFinanceAccount({
        name: accountForm.name.trim(),
        code: accountForm.code.trim() || undefined,
        account_type: accountForm.account_type as "bank" | "cash" | "wallet" | "other",
        currency: accountForm.currency.toUpperCase(),
        opening_balance: accountForm.opening_balance.trim() ? Number(accountForm.opening_balance) : 0,
      });
      setAccountForm({ name: "", code: "", account_type: "bank", currency: "NGN", opening_balance: "" });
      setNotice({ tone: "success", message: "Account created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to create account." });
    } finally {
      setSavingAccount(false);
    }
  };

  const submitIncome = async () => {
    if (!incomeForm.account_id || !incomeForm.amount.trim()) {
      setNotice({ tone: "warning", message: "Account and amount are required for income." });
      return;
    }
    try {
      setSavingIncome(true);
      await createFinanceIncome({
        account_id: incomeForm.account_id,
        amount: Number(incomeForm.amount),
        currency: incomeForm.currency.toUpperCase(),
        reference: incomeForm.reference.trim() || undefined,
        payer: incomeForm.payer.trim() || undefined,
        notes: incomeForm.notes.trim() || undefined,
        received_at: incomeForm.received_at || undefined,
      });
      setIncomeForm((prev) => ({ ...prev, amount: "", reference: "", payer: "", notes: "", received_at: "" }));
      setNotice({ tone: "success", message: "Income posted to ledger." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to create income entry." });
    } finally {
      setSavingIncome(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Accounts</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-7">
          <div className="box p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Accounts</div>
              <div className="text-sm text-slate-500">
                Total opening balance: {formatMoney(totalOpeningBalance, "-", "NGN")}
              </div>
            </div>
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Currency</Table.Th>
                  <Table.Th>Opening</Table.Th>
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
                    <Table.Td>{account.currency}</Table.Td>
                    <Table.Td>{formatMoney(account.opening_balance, "-", account.currency || "NGN")}</Table.Td>
                  </Table.Tr>
                ))}
                {!loading && accounts.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-slate-500 py-6">
                      No accounts yet.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>

          <div className="box p-5 mt-5">
            <div className="font-medium mb-3">Recent Transactions</div>
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Direction</Table.Th>
                  <Table.Th>Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentLedger.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{formatDisplayDate(entry.entry_date)}</Table.Td>
                    <Table.Td>{entry.account_name}</Table.Td>
                    <Table.Td className="capitalize">{entry.direction}</Table.Td>
                    <Table.Td>{formatMoney(entry.amount, "-", entry.currency || "NGN")}</Table.Td>
                  </Table.Tr>
                ))}
                {!loading && recentLedger.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-slate-500 py-6">
                      No ledger entries yet.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="box p-5">
            <div className="font-medium mb-3">Create Account</div>
            <div className="space-y-3">
              <div>
                <FormLabel>Name</FormLabel>
                <FormInput value={accountForm.name} onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <FormLabel>Code</FormLabel>
                  <FormInput value={accountForm.code} onChange={(e) => setAccountForm((prev) => ({ ...prev, code: e.target.value }))} />
                </div>
                <div className="col-span-6">
                  <FormLabel>Type</FormLabel>
                  <FormSelect value={accountForm.account_type} onChange={(e) => setAccountForm((prev) => ({ ...prev, account_type: e.target.value }))}>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                    <option value="wallet">Wallet</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <FormLabel>Currency</FormLabel>
                  <FormInput value={accountForm.currency} onChange={(e) => setAccountForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
                </div>
                <div className="col-span-6">
                  <FormLabel>Opening Balance</FormLabel>
                  <FormInput type="number" value={accountForm.opening_balance} onChange={(e) => setAccountForm((prev) => ({ ...prev, opening_balance: e.target.value }))} />
                </div>
              </div>
              <Button variant="primary" onClick={() => void submitAccount()} disabled={savingAccount}>
                {savingAccount ? "Saving..." : "Create Account"}
              </Button>
            </div>
          </div>

          <div className="box p-5 mt-5">
            <div className="font-medium mb-3">Post Income</div>
            <div className="space-y-3">
              <div>
                <FormLabel>Account</FormLabel>
                <FormSelect value={incomeForm.account_id} onChange={(e) => setIncomeForm((prev) => ({ ...prev, account_id: e.target.value }))}>
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} {account.code ? `(${account.code})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <FormLabel>Amount</FormLabel>
                  <FormInput type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))} />
                </div>
                <div className="col-span-6">
                  <FormLabel>Currency</FormLabel>
                  <FormInput value={incomeForm.currency} onChange={(e) => setIncomeForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <FormLabel>Reference</FormLabel>
                  <FormInput value={incomeForm.reference} onChange={(e) => setIncomeForm((prev) => ({ ...prev, reference: e.target.value }))} />
                </div>
                <div className="col-span-6">
                  <FormLabel>Payer</FormLabel>
                  <FormInput value={incomeForm.payer} onChange={(e) => setIncomeForm((prev) => ({ ...prev, payer: e.target.value }))} />
                </div>
              </div>
              <div>
                <FormLabel>Received Date</FormLabel>
                <FormInput type="date" value={incomeForm.received_at} onChange={(e) => setIncomeForm((prev) => ({ ...prev, received_at: e.target.value }))} />
              </div>
              <div>
                <FormLabel>Notes</FormLabel>
                <FormTextarea rows={2} value={incomeForm.notes} onChange={(e) => setIncomeForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <Button variant="primary" onClick={() => void submitIncome()} disabled={savingIncome}>
                {savingIncome ? "Posting..." : "Post Income"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FinanceAccountsPage;

