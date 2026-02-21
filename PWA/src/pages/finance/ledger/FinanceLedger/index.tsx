import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceIncome,
  createFinanceTransfer,
  listFinanceAccounts,
  listFinanceLedger,
  type FinanceAccountRecord,
  type FinanceLedgerRecord,
} from "@/services/finance";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceLedgerPage() {
  const [accounts, setAccounts] = useState<FinanceAccountRecord[]>([]);
  const [rows, setRows] = useState<FinanceLedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [filters, setFilters] = useState({
    account_id: "",
    direction: "",
    source_type: "",
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
  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    currency: "NGN",
    reference: "",
    note: "",
    transfer_at: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [accountRows, ledgerRows] = await Promise.all([
        listFinanceAccounts({ is_active: true }),
        listFinanceLedger({
          ...(filters.account_id ? { account_id: filters.account_id } : {}),
          ...(filters.direction ? { direction: filters.direction } : {}),
          ...(filters.source_type ? { source_type: filters.source_type } : {}),
          limit: 300,
        }),
      ]);
      setAccounts(accountRows);
      setRows(ledgerRows);
      if (!incomeForm.account_id && accountRows[0]?.id) {
        setIncomeForm((prev) => ({ ...prev, account_id: accountRows[0].id }));
      }
      if (!transferForm.from_account_id && accountRows[0]?.id) {
        setTransferForm((prev) => ({ ...prev, from_account_id: accountRows[0].id }));
      }
      if (!transferForm.to_account_id && accountRows[1]?.id) {
        setTransferForm((prev) => ({ ...prev, to_account_id: accountRows[1].id }));
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load ledger." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setShowIncomeModal(false);
      setIncomeForm((prev) => ({ ...prev, amount: "", reference: "", payer: "", notes: "", received_at: "" }));
      setNotice({ tone: "success", message: "Income posted to ledger." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to create income entry." });
    } finally {
      setSavingIncome(false);
    }
  };

  const submitTransfer = async () => {
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount.trim()) {
      setNotice({ tone: "warning", message: "From account, To account, and amount are required." });
      return;
    }
    try {
      setSavingTransfer(true);
      await createFinanceTransfer({
        from_account_id: transferForm.from_account_id,
        to_account_id: transferForm.to_account_id,
        amount: Number(transferForm.amount),
        currency: transferForm.currency.toUpperCase(),
        reference: transferForm.reference.trim() || undefined,
        note: transferForm.note.trim() || undefined,
        transfer_at: transferForm.transfer_at || undefined,
      });
      setShowTransferModal(false);
      setTransferForm((prev) => ({ ...prev, amount: "", reference: "", note: "", transfer_at: "" }));
      setNotice({ tone: "success", message: "Transfer posted to ledger." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to post transfer." });
    } finally {
      setSavingTransfer(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Ledger</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowIncomeModal(true)}>Post Income</Button>
          <Button variant="outline-primary" onClick={() => setShowTransferModal(true)}>Transfer</Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Account</FormLabel>
            <FormSelect value={filters.account_id} onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value }))}>
              <option value="">All</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Direction</FormLabel>
            <FormSelect value={filters.direction} onChange={(e) => setFilters((prev) => ({ ...prev, direction: e.target.value }))}>
              <option value="">All</option>
              <option value="in">In</option>
              <option value="out">Out</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Source Type</FormLabel>
            <FormSelect value={filters.source_type} onChange={(e) => setFilters((prev) => ({ ...prev, source_type: e.target.value }))}>
              <option value="">All</option>
              <option value="finance_income">Income</option>
              <option value="finance_transfer">Transfer</option>
              <option value="finance_payment_voucher">Disbursement (PV)</option>
              <option value="opening_balance">Opening Balance</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2 flex items-end">
            <Button variant="outline-primary" onClick={() => void load()} disabled={loading}>
              {loading ? "Loading..." : "Apply"}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Direction</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Description</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{formatDisplayDate(entry.entry_date)}</Table.Td>
                  <Table.Td>
                    <div className="font-medium">{entry.account_name}</div>
                    <div className="text-xs text-slate-500">{entry.account_code || "-"}</div>
                  </Table.Td>
                  <Table.Td className="capitalize">{entry.direction}</Table.Td>
                  <Table.Td>{formatMoney(entry.amount, "-", entry.currency || "NGN")}</Table.Td>
                  <Table.Td>{entry.source_type || "-"}</Table.Td>
                  <Table.Td>{entry.description || "-"}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center text-slate-500 py-8">No ledger entries found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <Dialog open={showIncomeModal} onClose={() => setShowIncomeModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Post Income</div>
            <div>
              <FormLabel>Account</FormLabel>
              <FormSelect value={incomeForm.account_id} onChange={(e) => setIncomeForm((prev) => ({ ...prev, account_id: e.target.value }))}>
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}{account.code ? ` (${account.code})` : ""}</option>
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
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => setShowIncomeModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitIncome()} disabled={savingIncome}>
              {savingIncome ? "Posting..." : "Post Income"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showTransferModal} onClose={() => setShowTransferModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Transfer Between Accounts</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>From</FormLabel>
                <FormSelect value={transferForm.from_account_id} onChange={(e) => setTransferForm((prev) => ({ ...prev, from_account_id: e.target.value }))}>
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-6">
                <FormLabel>To</FormLabel>
                <FormSelect value={transferForm.to_account_id} onChange={(e) => setTransferForm((prev) => ({ ...prev, to_account_id: e.target.value }))}>
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </FormSelect>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Amount</FormLabel>
                <FormInput type="number" value={transferForm.amount} onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Currency</FormLabel>
                <FormInput value={transferForm.currency} onChange={(e) => setTransferForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <FormLabel>Reference</FormLabel>
                <FormInput value={transferForm.reference} onChange={(e) => setTransferForm((prev) => ({ ...prev, reference: e.target.value }))} />
              </div>
              <div className="col-span-6">
                <FormLabel>Transfer Date</FormLabel>
                <FormInput type="date" value={transferForm.transfer_at} onChange={(e) => setTransferForm((prev) => ({ ...prev, transfer_at: e.target.value }))} />
              </div>
            </div>
            <div>
              <FormLabel>Note</FormLabel>
              <FormTextarea rows={2} value={transferForm.note} onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => setShowTransferModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitTransfer()} disabled={savingTransfer}>
              {savingTransfer ? "Posting..." : "Post Transfer"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceLedgerPage;

