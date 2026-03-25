import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  backfillFinanceAccounting,
  getFinanceBalances,
  getFinanceExecutiveSummary,
  getFinanceExpenseSummary,
  getFinanceIncomeSummary,
  getFinanceProfitLoss,
} from "@/services/financeReporting";
import { listFinanceReportingPeriods } from "@/services/financeAccounting";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceReportsDashboardPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyBackfill, setBusyBackfill] = useState(false);
  const [periods, setPeriods] = useState<Array<{ id: string; label: string }>>([]);
  const [filters, setFilters] = useState({ period_id: "", from: "", to: "", comparison_period: "previous" });
  const [executive, setExecutive] = useState<any>(null);
  const [income, setIncome] = useState<any>(null);
  const [expense, setExpense] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.period_id ? { period_id: filters.period_id } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.comparison_period ? { comparison_period: filters.comparison_period } : {}),
      };
      const [periodRows, executiveData, incomeData, expenseData, profitData, balanceData] = await Promise.all([
        listFinanceReportingPeriods({ status: "open" }).catch(() => []),
        getFinanceExecutiveSummary(params),
        getFinanceIncomeSummary(params),
        getFinanceExpenseSummary(params),
        getFinanceProfitLoss(params),
        getFinanceBalances(params),
      ]);
      setPeriods(periodRows.map((row) => ({ id: row.id, label: row.label })));
      setExecutive(executiveData);
      setIncome(incomeData);
      setExpense(expenseData);
      setProfitLoss(profitData);
      setBalances(balanceData);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load finance reports." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(() => {
    if (!executive) return [];
    return [
      { label: "Income", value: formatMoney(executive.executive_summary.total_income), icon: "BadgeDollarSign", color: "text-success" },
      { label: "Support & Revenue", value: formatMoney(executive.executive_summary.total_support_and_revenue ?? executive.executive_summary.total_income), icon: "BadgeCheck", color: "text-success" },
      { label: "Expense", value: formatMoney(executive.executive_summary.total_expense), icon: "Receipt", color: "text-danger" },
      { label: "Surplus / Deficit", value: formatMoney(executive.executive_summary.surplus_deficit ?? executive.executive_summary.net_profit_loss), icon: "TrendingUp", color: (executive.executive_summary.surplus_deficit ?? executive.executive_summary.net_profit_loss) >= 0 ? "text-primary" : "text-danger" },
      { label: "Bank Balance", value: formatMoney(executive.executive_summary.bank_balance), icon: "Wallet", color: "text-warning" },
      { label: "Reserve Balance", value: formatMoney(executive.executive_summary.reserve_balance), icon: "PiggyBank", color: "text-pending" },
      { label: "Receivables", value: formatMoney(executive.executive_summary.receivables), icon: "CircleDollarSign", color: "text-primary" },
      { label: "Payables", value: formatMoney(executive.executive_summary.payables), icon: "CreditCard", color: "text-warning" },
      { label: "Advances", value: formatMoney(executive.executive_summary.advances), icon: "HandCoins", color: "text-slate-500" },
      { label: "Restricted Net Assets", value: formatMoney(executive.executive_summary.restricted_net_assets), icon: "Lock", color: "text-warning" },
      { label: "Unrestricted Net Assets", value: formatMoney(executive.executive_summary.unrestricted_net_assets), icon: "CheckCircle2", color: "text-success" },
    ];
  }, [executive]);

  const exportExcel = () => {
    if (!executive || !income || !expense || !profitLoss || !balances) return;
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet([
      { metric: "Period", value: executive.period?.label || "Custom" },
      { metric: "Support & Revenue", value: executive.executive_summary.total_support_and_revenue ?? executive.executive_summary.total_income },
      { metric: "Expense", value: executive.executive_summary.total_expense },
      { metric: "Surplus/Deficit", value: executive.executive_summary.surplus_deficit ?? executive.executive_summary.net_profit_loss },
      { metric: "Bank Balance", value: executive.executive_summary.bank_balance },
      { metric: "Reserve Balance", value: executive.executive_summary.reserve_balance },
      { metric: "Receivables", value: executive.executive_summary.receivables },
      { metric: "Payables", value: executive.executive_summary.payables },
      { metric: "Advances", value: executive.executive_summary.advances },
      { metric: "Grant Income", value: executive.executive_summary.grant_income ?? 0 },
      { metric: "Donation Income", value: executive.executive_summary.donation_income ?? 0 },
      { metric: "Service Income", value: executive.executive_summary.service_income ?? 0 },
      { metric: "Restricted Net Assets", value: executive.executive_summary.restricted_net_assets ?? 0 },
      { metric: "Unrestricted Net Assets", value: executive.executive_summary.unrestricted_net_assets ?? 0 },
      { metric: "Deferred Grant Income", value: executive.executive_summary.deferred_grant_income ?? 0 },
    ]);
    const incomeSheet = XLSX.utils.json_to_sheet((income.breakdown || []).map((row: any) => ({ code: row.code, name: row.name, category: row.category, amount: row.amount })));
    const expenseSheet = XLSX.utils.json_to_sheet((expense.breakdown || []).map((row: any) => ({ code: row.code, name: row.name, category: row.category, amount: row.amount })));
    const balanceSheet = XLSX.utils.json_to_sheet((balances.bank_and_reserve_balances?.accounts || []).map((row: any) => ({ code: row.code, name: row.name, category: row.category, balance: row.balance })));
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Executive Summary");
    XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income Summary");
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expense Summary");
    XLSX.utils.book_append_sheet(workbook, balanceSheet, "Balances");
    XLSX.writeFile(workbook, `finance-report-${executive.period?.label || "custom"}.xlsx`);
  };

  const runBackfill = async () => {
    try {
      setBusyBackfill(true);
      const result = await backfillFinanceAccounting();
      setNotice({ tone: "success", message: `Backfill completed. ${result.created_count} journal entries created.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to backfill accounting records." });
    } finally {
      setBusyBackfill(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Reports</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/app/finance/reports/activities")}>
            <Lucide icon="TrendingUp" className="w-4 h-4 mr-1" /> Statement of Activities
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/app/finance/reports/position")}>
            <Lucide icon="Wallet" className="w-4 h-4 mr-1" /> Financial Position
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/app/finance/reports/budget-vs-actual")}>
            <Lucide icon="BarChart2" className="w-4 h-4 mr-1" /> Budget vs Actual
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/app/finance/reports/grant-utilization")}>
            <Lucide icon="CircleDollarSign" className="w-4 h-4 mr-1" /> Grant Utilization
          </Button>
          <Button variant="outline-secondary" onClick={() => window.print()}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Export PDF
          </Button>
          <Button variant="outline-primary" onClick={exportExcel}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Button variant="outline-warning" onClick={() => void runBackfill()} disabled={busyBackfill}>
            <Lucide icon="Undo2" className={clsx("w-4 h-4 mr-1", busyBackfill && "animate-spin")} /> Backfill Journals
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-4">
          <FormLabel>Reporting Period</FormLabel>
          <FormSelect value={filters.period_id} onChange={(e) => setFilters((prev) => ({ ...prev, period_id: e.target.value }))}>
            <option value="">Use custom dates / current month</option>
            {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>From</FormLabel>
          <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value, period_id: "" }))} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>To</FormLabel>
          <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value, period_id: "" }))} />
        </div>
        <div className="col-span-12 md:col-span-2 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" /> Apply
          </Button>
        </div>
      </div>

      <div className="text-sm text-slate-500 mt-3">
        Period: {executive?.period?.label || "-"} ({formatDisplayDate(executive?.period?.start_date)} - {formatDisplayDate(executive?.period?.end_date)})
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        {cards.map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
            <div className="box p-5">
              <div className="flex items-center gap-3">
                <Lucide icon={card.icon as any} className={clsx("w-6 h-6", card.color)} />
                <div className="text-slate-500">{card.label}</div>
              </div>
              <div className="mt-4 text-2xl font-medium">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-6 box p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Income Summary</h3>
            <div className="text-sm text-success font-medium">{formatMoney(income?.total_income)}</div>
          </div>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Code</Table.Th><Table.Th>Name</Table.Th><Table.Th>Category</Table.Th><Table.Th className="text-right">Amount</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(income?.breakdown || []).slice(0, 8).map((row: any) => (
                <Table.Tr key={row.account_id}><Table.Td>{row.code}</Table.Td><Table.Td>{row.name}</Table.Td><Table.Td>{row.category}</Table.Td><Table.Td className="text-right">{formatMoney(row.amount)}</Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        <div className="col-span-12 xl:col-span-6 box p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Expense Summary</h3>
            <div className="text-sm text-danger font-medium">{formatMoney(expense?.total_expense)}</div>
          </div>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Code</Table.Th><Table.Th>Name</Table.Th><Table.Th>Category</Table.Th><Table.Th className="text-right">Amount</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(expense?.breakdown || []).slice(0, 8).map((row: any) => (
                <Table.Tr key={row.account_id}><Table.Td>{row.code}</Table.Td><Table.Td>{row.name}</Table.Td><Table.Td>{row.category}</Table.Td><Table.Td className="text-right">{formatMoney(row.amount)}</Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-6 box p-5">
            <h3 className="font-medium mb-4">Statement of Activities</h3>
            <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Total Support &amp; Revenue</span><span>{formatMoney(profitLoss?.statement_of_activities?.total_support_and_revenue ?? profitLoss?.income_total)}</span></div>
            <div className="flex justify-between"><span>Total Expense</span><span>{formatMoney(profitLoss?.expense_total)}</span></div>
            <div className="flex justify-between font-medium text-base border-t pt-3"><span>Surplus / Deficit</span><span>{formatMoney(profitLoss?.statement_of_activities?.surplus_deficit ?? profitLoss?.net_profit_loss)}</span></div>
            </div>
          </div>
        <div className="col-span-12 xl:col-span-6 box p-5">
          <h3 className="font-medium mb-4">Bank &amp; Reserve Balances</h3>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Account</Table.Th><Table.Th>Category</Table.Th><Table.Th className="text-right">Balance</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(balances?.bank_and_reserve_balances?.accounts || []).map((row: any) => (
                <Table.Tr key={row.id}><Table.Td>{row.name}</Table.Td><Table.Td>{row.category}</Table.Td><Table.Td className="text-right">{formatMoney(row.balance)}</Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <h3 className="font-medium mb-4">Notes &amp; Recommendations</h3>
        <div className="space-y-3">
          {[...(executive?.notes?.saved || []), ...(executive?.notes?.generated || [])].map((note: any, idx: number) => (
            <div key={`${note.title}-${idx}`} className="border rounded-md p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{note.title}</div>
                <div className={clsx("text-xs uppercase px-2 py-1 rounded", note.severity === "critical" ? "bg-danger/20 text-danger" : note.severity === "warning" ? "bg-warning/20 text-warning" : "bg-slate-100 text-slate-600")}>{note.severity}</div>
              </div>
              <div className="text-sm text-slate-600 mt-2">{note.body}</div>
            </div>
          ))}
          {!executive?.notes?.saved?.length && !executive?.notes?.generated?.length ? <div className="text-sm text-slate-500">No notes for this period yet.</div> : null}
        </div>
      </div>

      <div className="box p-5 mt-5">
        <h3 className="font-medium mb-4">Fund Activity</h3>
        <Table>
          <Table.Thead>
            <Table.Tr><Table.Th>Fund</Table.Th><Table.Th>Restriction</Table.Th><Table.Th className="text-right">Income</Table.Th><Table.Th className="text-right">Expense</Table.Th><Table.Th className="text-right">Net</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(profitLoss?.fund_activity || executive?.fund_activity || []).map((row: any) => (
              <Table.Tr key={row.fund_id}>
                <Table.Td>{row.fund_name}</Table.Td>
                <Table.Td>{row.restriction_type}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.income)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.expense)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.net)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default FinanceReportsDashboardPage;
