import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getFinanceAccount, listFinanceLedger, type FinanceAccountRecord, type FinanceLedgerRecord } from "@/services/finance";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceAccountDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState<FinanceAccountRecord | null>(null);
  const [rows, setRows] = useState<FinanceLedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({
    direction: "",
    source_type: "",
    from: "",
    to: "",
  });

  const totals = useMemo(() => {
    const totalIn = rows.filter((r) => r.direction === "in").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalOut = rows.filter((r) => r.direction === "out").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const net = totalIn - totalOut;
    return { totalIn, totalOut, net };
  }, [rows]);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [accountData, ledger] = await Promise.all([
        getFinanceAccount(id),
        listFinanceLedger({
          account_id: id,
          ...(filters.direction ? { direction: filters.direction } : {}),
          ...(filters.source_type ? { source_type: filters.source_type } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
          limit: 500,
        }),
      ]);
      setAccount(accountData);
      setRows(ledger);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load account details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Account Details</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/app/finance/accounts")}>Back</Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        {account ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Name</div><div className="font-medium">{account.name}</div></div>
            <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Type</div><div className="capitalize">{account.account_type}</div></div>
            <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Currency</div><div>{account.currency}</div></div>
            <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Opening</div><div>{formatMoney(account.opening_balance, "-", account.currency || "NGN")}</div></div>
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Code</div><div>{account.code || "-"}</div></div>
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Bank Name</div><div>{account.bank_name || "-"}</div></div>
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Account Name</div><div>{account.account_name || "-"}</div></div>
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Account Number</div><div>{account.account_number || "-"}</div></div>
            <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Branch</div><div>{account.branch_name || "-"}</div></div>
          </div>
        ) : (
          <div className="text-slate-500">Loading account...</div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="box col-span-12 md:col-span-4 p-5">
          <div className="text-xs text-slate-500">Total Inflow</div>
          <div className="text-lg font-medium">{formatMoney(totals.totalIn, "-", account?.currency || "NGN")}</div>
        </div>
        <div className="box col-span-12 md:col-span-4 p-5">
          <div className="text-xs text-slate-500">Total Outflow</div>
          <div className="text-lg font-medium">{formatMoney(totals.totalOut, "-", account?.currency || "NGN")}</div>
        </div>
        <div className="box col-span-12 md:col-span-4 p-5">
          <div className="text-xs text-slate-500">Net Flow</div>
          <div className="text-lg font-medium">{formatMoney(totals.net, "-", account?.currency || "NGN")}</div>
        </div>
      </div>

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Direction</FormLabel>
            <FormSelect value={filters.direction} onChange={(e) => setFilters((prev) => ({ ...prev, direction: e.target.value }))}>
              <option value="">All</option>
              <option value="in">Inflow</option>
              <option value="out">Outflow</option>
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
          <div className="col-span-12 md:col-span-2">
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
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
                <Table.Th>Direction</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Description</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.entry_date)}</Table.Td>
                  <Table.Td className="capitalize">{row.direction}</Table.Td>
                  <Table.Td>{formatMoney(row.amount, "-", row.currency || account?.currency || "NGN")}</Table.Td>
                  <Table.Td>{row.source_type || "-"}</Table.Td>
                  <Table.Td>{row.description || "-"}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center text-slate-500 py-8">No transactions found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default FinanceAccountDetailPage;

