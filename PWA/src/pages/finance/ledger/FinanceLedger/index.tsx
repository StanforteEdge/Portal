import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceAccounts, listFinanceLedger, type FinanceAccountRecord, type FinanceLedgerRecord } from "@/services/finance";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceLedgerPage() {
  const [accounts, setAccounts] = useState<FinanceAccountRecord[]>([]);
  const [rows, setRows] = useState<FinanceLedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({
    account_id: "",
    direction: "",
    source_type: "",
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

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Ledger</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Account</FormLabel>
            <FormSelect value={filters.account_id} onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value }))}>
              <option value="">All</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Direction</FormLabel>
            <FormSelect value={filters.direction} onChange={(e) => setFilters((prev) => ({ ...prev, direction: e.target.value }))}>
              <option value="">All</option>
              <option value="in">In</option>
              <option value="out">Out</option>
              <option value="transfer">Transfer</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Source Type</FormLabel>
            <FormInput value={filters.source_type} onChange={(e) => setFilters((prev) => ({ ...prev, source_type: e.target.value }))} placeholder="finance_income" />
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
                  <Table.Td colSpan={6} className="text-center text-slate-500 py-8">
                    No ledger entries found.
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default FinanceLedgerPage;

