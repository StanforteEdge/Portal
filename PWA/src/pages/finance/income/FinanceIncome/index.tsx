import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceAccounts, listFinanceIncome, type FinanceAccountRecord } from "@/services/finance";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceIncomePage() {
  const [accounts, setAccounts] = useState<FinanceAccountRecord[]>([]);
  const [rows, setRows] = useState<
    Array<{
      id: string;
      account_id: string;
      account_name: string;
      account_code: string | null;
      amount: number;
      currency: string;
      received_at: string;
      reference: string | null;
      payer: string | null;
      notes: string | null;
      file: { id: string; file_name: string; public_url: string | null } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({
    account_id: "",
    from: "",
    to: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [accountRows, incomeRows] = await Promise.all([
        listFinanceAccounts({ is_active: true }),
        listFinanceIncome({
          ...(filters.account_id ? { account_id: filters.account_id } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
          limit: 300,
        }),
      ]);
      setAccounts(accountRows);
      setRows(incomeRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load income records." });
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
        <h2 className="mr-auto text-lg font-medium">Finance Income</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Account</FormLabel>
            <FormSelect value={filters.account_id} onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value }))}>
              <option value="">All</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3 flex items-end">
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
                <Table.Th>Payer</Table.Th>
                <Table.Th>Reference</Table.Th>
                <Table.Th>Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.received_at)}</Table.Td>
                  <Table.Td>{row.account_name}</Table.Td>
                  <Table.Td>{row.payer || "-"}</Table.Td>
                  <Table.Td>{row.reference || "-"}</Table.Td>
                  <Table.Td>{formatMoney(row.amount, "-", row.currency || "NGN")}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center text-slate-500 py-8">
                    No income entries found.
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

export default FinanceIncomePage;

