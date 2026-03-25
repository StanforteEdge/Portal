import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import { getFinanceGrantUtilization } from "@/services/financeReporting";
import { formatMoney } from "@/utils/formatting";

function FinanceGrantUtilizationPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [filters, setFilters] = useState({ fund_id: "", grant_id: "", status: "", from: "", to: "" });
  const [report, setReport] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [fundRows, grantRows, reportData] = await Promise.all([
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
        getFinanceGrantUtilization({
          ...(filters.fund_id ? { fund_id: filters.fund_id } : {}),
          ...(filters.grant_id ? { grant_id: filters.grant_id } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
        }),
      ]);
      setFunds(fundRows);
      setGrants(grantRows);
      setReport(reportData);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load grant utilization." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Grant Utilization</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Fund</FormLabel>
          <FormSelect value={filters.fund_id} onChange={(e) => setFilters((prev) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}>
            <option value="">All funds</option>
            {funds.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Grant</FormLabel>
          <FormSelect value={filters.grant_id} onChange={(e) => setFilters((prev) => ({ ...prev, grant_id: e.target.value }))}>
            <option value="">All grants</option>
            {grants
              .filter((row) => !filters.fund_id || row.fund?.id === filters.fund_id)
              .map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-2">
          <FormLabel>Status</FormLabel>
          <FormSelect value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
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
        <div className="col-span-12">
          <Button variant="primary" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" /> Apply Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Committed</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.committed_amount || 0)}</div>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Cash Received</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.cash_received || 0)}</div>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Utilized</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.expense_utilized || 0)}</div>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Remaining Budget</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.remaining_budget || 0)}</div>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Grant</Table.Th>
              <Table.Th>Fund</Table.Th>
              <Table.Th className="text-right">Committed</Table.Th>
              <Table.Th className="text-right">Received</Table.Th>
              <Table.Th className="text-right">Utilized</Table.Th>
              <Table.Th className="text-right">Deferred</Table.Th>
              <Table.Th className="text-right">Remaining</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(report?.items || []).map((item: any) => (
              <Table.Tr key={item.grant.id}>
                <Table.Td>
                  <div className="font-medium">{item.grant.code}</div>
                  <div className="text-xs text-slate-500">{item.grant.name}</div>
                </Table.Td>
                <Table.Td>{item.grant.fund?.name || "-"}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.committed_amount)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.cash_received)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.expense_utilized)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.deferred_amount)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.remaining_budget)}</Table.Td>
              </Table.Tr>
            ))}
            {!(report?.items || []).length ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500 py-10">
                  No grants found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default FinanceGrantUtilizationPage;
