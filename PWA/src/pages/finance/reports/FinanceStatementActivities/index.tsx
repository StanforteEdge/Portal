import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceReportingPeriods, listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import { getFinanceProfitLoss } from "@/services/financeReporting";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceStatementActivitiesPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<Array<{ id: string; label: string }>>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [filters, setFilters] = useState({
    period_id: "",
    from: "",
    to: "",
    organization_id: "",
    team_id: "",
    fund_id: "",
    grant_id: "",
  });

  const filteredGrantOptions = useMemo(
    () => (filters.fund_id ? grants.filter((grant) => String(grant.fund?.id || "") === filters.fund_id) : grants),
    [grants, filters.fund_id]
  );

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.period_id ? { period_id: filters.period_id } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.organization_id ? { organization_id: filters.organization_id } : {}),
        ...(filters.team_id ? { team_id: filters.team_id } : {}),
        ...(filters.fund_id ? { fund_id: filters.fund_id } : {}),
        ...(filters.grant_id ? { grant_id: filters.grant_id } : {}),
      };
      const [periodRows, organizationRows, teamRows, fundRows, grantRows, reportData] = await Promise.all([
        listFinanceReportingPeriods({}).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listFinanceFunds({ is_active: true }).catch(() => []),
        listFinanceGrants({ status: "active" }).catch(() => []),
        getFinanceProfitLoss(params),
      ]);
      setPeriods(periodRows.map((row) => ({ id: row.id, label: row.label })));
      setOrganizations(organizationRows);
      setTeams(teamRows);
      setFunds(fundRows);
      setGrants(grantRows);
      setReport(reportData);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load statement of activities." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      if (!prev.grant_id) return prev;
      const exists = filteredGrantOptions.some((grant) => String(grant.id) === prev.grant_id);
      return exists ? prev : { ...prev, grant_id: "" };
    });
  }, [filteredGrantOptions]);

  const exportExcel = () => {
    if (!report) return;
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet([
      { metric: "Period", value: report.period?.label || "Custom" },
      { metric: "Support & Revenue", value: report.statement_of_activities?.total_support_and_revenue || 0 },
      { metric: "Expenses", value: report.statement_of_activities?.total_expense || 0 },
      { metric: "Surplus / Deficit", value: report.statement_of_activities?.surplus_deficit || 0 },
    ]);
    const revenueSheet = XLSX.utils.json_to_sheet(
      Object.entries(report.statement_of_activities?.support_and_revenue_by_category || {}).map(([category, amount]) => ({ category, amount }))
    );
    const expenseSheet = XLSX.utils.json_to_sheet(
      Object.entries(report.statement_of_activities?.expenses_by_category || {}).map(([category, amount]) => ({ category, amount }))
    );
    const fundSheet = XLSX.utils.json_to_sheet(
      (report.fund_activity || []).map((row: any) => ({
        fund: row.fund_name,
        restriction: row.restriction_type,
        income: row.income,
        expense: row.expense,
        net: row.net,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "SupportRevenue");
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");
    XLSX.utils.book_append_sheet(workbook, fundSheet, "FundActivity");
    XLSX.writeFile(workbook, `statement-of-activities-${report.period?.label || "custom"}.xlsx`);
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Statement of Activities</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => window.print()}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Export PDF
          </Button>
          <Button variant="outline-primary" onClick={exportExcel}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-3"><FormLabel>Period</FormLabel><FormSelect value={filters.period_id} onChange={(e) => setFilters((prev) => ({ ...prev, period_id: e.target.value }))}><option value="">Current/custom</option>{periods.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</FormSelect></div>
        <div className="col-span-12 md:col-span-2"><FormLabel>From</FormLabel><FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value, period_id: "" }))} /></div>
        <div className="col-span-12 md:col-span-2"><FormLabel>To</FormLabel><FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value, period_id: "" }))} /></div>
        <div className="col-span-12 md:col-span-2"><FormLabel>Organization</FormLabel><FormSelect value={filters.organization_id} onChange={(e) => setFilters((prev) => ({ ...prev, organization_id: e.target.value }))}><option value="">All</option>{organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
        <div className="col-span-12 md:col-span-1"><FormLabel>Team</FormLabel><FormSelect value={filters.team_id} onChange={(e) => setFilters((prev) => ({ ...prev, team_id: e.target.value }))}><option value="">All</option>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
        <div className="col-span-12 md:col-span-1"><FormLabel>Fund</FormLabel><FormSelect value={filters.fund_id} onChange={(e) => setFilters((prev) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}><option value="">All</option>{funds.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}</FormSelect></div>
        <div className="col-span-12 md:col-span-1"><FormLabel>Grant</FormLabel><FormSelect value={filters.grant_id} onChange={(e) => setFilters((prev) => ({ ...prev, grant_id: e.target.value }))}><option value="">All</option>{filteredGrantOptions.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}</FormSelect></div>
      </div>

      <div className="text-sm text-slate-500 mt-3">
        Period: {report?.period?.label || "-"} ({formatDisplayDate(report?.period?.start_date)} - {formatDisplayDate(report?.period?.end_date)})
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 md:col-span-4 box p-5">
          <div className="text-slate-500">Support & Revenue</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.statement_of_activities?.total_support_and_revenue)}</div>
        </div>
        <div className="col-span-12 md:col-span-4 box p-5">
          <div className="text-slate-500">Expenses</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.statement_of_activities?.total_expense)}</div>
        </div>
        <div className="col-span-12 md:col-span-4 box p-5">
          <div className="text-slate-500">Surplus / Deficit</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(report?.statement_of_activities?.surplus_deficit)}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-6 box p-5">
          <h3 className="font-medium mb-4">Support & Revenue by Category</h3>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Category</Table.Th><Table.Th className="text-right">Amount</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {Object.entries(report?.statement_of_activities?.support_and_revenue_by_category || {}).map(([category, amount]) => (
                <Table.Tr key={category}><Table.Td>{category}</Table.Td><Table.Td className="text-right">{formatMoney(Number(amount || 0))}</Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        <div className="col-span-12 xl:col-span-6 box p-5">
          <h3 className="font-medium mb-4">Expenses by Category</h3>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Category</Table.Th><Table.Th className="text-right">Amount</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {Object.entries(report?.statement_of_activities?.expenses_by_category || {}).map(([category, amount]) => (
                <Table.Tr key={category}><Table.Td>{category}</Table.Td><Table.Td className="text-right">{formatMoney(Number(amount || 0))}</Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-6 box p-5">
          <h3 className="font-medium mb-4">By Restriction</h3>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Restriction</Table.Th><Table.Th className="text-right">Support & Revenue</Table.Th><Table.Th className="text-right">Expense</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {Array.from(new Set([
                ...Object.keys(report?.statement_of_activities?.support_and_revenue_by_restriction || {}),
                ...Object.keys(report?.statement_of_activities?.expenses_by_restriction || {}),
              ])).map((key) => (
                <Table.Tr key={key}>
                  <Table.Td>{key}</Table.Td>
                  <Table.Td className="text-right">{formatMoney(Number(report?.statement_of_activities?.support_and_revenue_by_restriction?.[key] || 0))}</Table.Td>
                  <Table.Td className="text-right">{formatMoney(Number(report?.statement_of_activities?.expenses_by_restriction?.[key] || 0))}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        <div className="col-span-12 xl:col-span-6 box p-5">
          <h3 className="font-medium mb-4">Fund Activity</h3>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Fund</Table.Th><Table.Th>Restriction</Table.Th><Table.Th className="text-right">Net</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {(report?.fund_activity || []).map((row: any) => (
                <Table.Tr key={row.fund_id}>
                  <Table.Td>{row.fund_name}</Table.Td>
                  <Table.Td>{row.restriction_type}</Table.Td>
                  <Table.Td className="text-right">{formatMoney(row.net)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default FinanceStatementActivitiesPage;
