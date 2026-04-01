import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceBudgets } from "@/services/financeAccounting";
import { getFinanceBudgetVsActual } from "@/services/financeReporting";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceBudgetVsActualPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budgetId, setBudgetId] = useState("");
  const [report, setReport] = useState<any>(null);

  const loadBudgets = async () => {
    try {
      const rows = await listFinanceBudgets({ status: "approved" }).catch(() => listFinanceBudgets());
      setBudgets(rows);
      if (!budgetId && rows[0]?.id) {
        setBudgetId(rows[0].id);
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load budgets." });
    }
  };

  const loadReport = async (selectedBudgetId: string) => {
    if (!selectedBudgetId) return;
    try {
      setLoading(true);
      const data = await getFinanceBudgetVsActual({ budget_id: selectedBudgetId });
      setReport(data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load budget report." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBudgets();
  }, []);

  useEffect(() => {
    if (budgetId) {
      void loadReport(budgetId);
    }
  }, [budgetId]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Budget vs Actual</h2>
        <Button variant="outline-secondary" onClick={() => budgetId && void loadReport(budgetId)} disabled={loading || !budgetId}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-8">
          <FormLabel>Budget</FormLabel>
          <FormSelect value={budgetId} onChange={(e) => setBudgetId(e.target.value)}>
            <option value="">Select budget</option>
            {budgets.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} - {row.budget_type}
              </option>
            ))}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-4 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => budgetId && void loadReport(budgetId)} disabled={!budgetId || loading}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" /> View Report
          </Button>
        </div>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
              <div className="text-slate-500 text-sm">Budget</div>
              <div className="text-2xl font-medium mt-2">{formatMoney(report.actuals.total_budget)}</div>
            </div>
            <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
              <div className="text-slate-500 text-sm">Actual</div>
              <div className="text-2xl font-medium mt-2">{formatMoney(report.actuals.total_actual)}</div>
            </div>
            <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
              <div className="text-slate-500 text-sm">Variance</div>
              <div className="text-2xl font-medium mt-2">{formatMoney(report.actuals.variance)}</div>
            </div>
            <div className="col-span-12 md:col-span-6 xl:col-span-3 box p-5">
              <div className="text-slate-500 text-sm">Utilization</div>
              <div className="text-2xl font-medium mt-2">{Number(report.actuals.utilization_pct || 0).toFixed(1)}%</div>
            </div>
          </div>

          <div className="box p-5 mt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{report.budget.name}</h3>
                <div className="text-slate-500 text-sm mt-1">
                  {formatDisplayDate(report.budget.start_date)} - {formatDisplayDate(report.budget.end_date)}
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  {(report.budget.scope_type || report.budget.budget_type || "budget").toUpperCase()} / {(report.budget.period_type || "annual").toUpperCase()}
                  {report.budget.fiscal_year ? ` / FY ${report.budget.fiscal_year}` : ""}
                  {report.budget.quarter ? ` / Q${report.budget.quarter}` : ""}
                  {report.budget.month ? ` / Month ${report.budget.month}` : ""}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="uppercase text-slate-500">{report.budget.budget_type}</div>
                <div>{report.budget.grant?.name || report.budget.fund?.name || report.budget.project_id || "General"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mt-5">
            <div className="col-span-12 xl:col-span-8 box p-5">
              <h3 className="font-medium mb-4">Section Summary</h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6 border rounded-md p-4">
                  <div className="text-slate-500 text-sm">Income Plan</div>
                  <div className="text-xl font-medium mt-1">{formatMoney(report.sections?.income?.planned || 0)}</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Actual</span><span>{formatMoney(report.sections?.income?.actual || 0)}</span></div>
                    <div className="flex justify-between font-medium"><span>Variance</span><span>{formatMoney(report.sections?.income?.variance || 0)}</span></div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6 border rounded-md p-4">
                  <div className="text-slate-500 text-sm">Expenditure Plan</div>
                  <div className="text-xl font-medium mt-1">{formatMoney(report.sections?.expenditure?.planned || 0)}</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Actual</span><span>{formatMoney(report.sections?.expenditure?.actual || 0)}</span></div>
                    <div className="flex justify-between font-medium"><span>Variance</span><span>{formatMoney(report.sections?.expenditure?.variance || 0)}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 xl:col-span-4 box p-5">
              <h3 className="font-medium mb-4">Assumptions</h3>
              {(report.budget.assumptions || []).length ? (
                <div className="space-y-3 text-sm">
                  {report.budget.assumptions.map((entry: any) => (
                    <div key={entry.id} className="border rounded-md p-3">
                      <div className="font-medium">{entry.label}</div>
                      <div className="text-slate-600 mt-1">{entry.value}</div>
                      {entry.notes ? <div className="text-slate-500 mt-1">{entry.notes}</div> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No assumptions recorded for this budget yet.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mt-5">
            <div className="col-span-12 xl:col-span-8 box p-5">
              <h3 className="font-medium mb-4">Budget Lines</h3>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Section</Table.Th>
                    <Table.Th>Group</Table.Th>
                    <Table.Th>Line Item</Table.Th>
                    <Table.Th className="text-right">Budgeted Amount</Table.Th>
                    <Table.Th className="text-right">Actual</Table.Th>
                    <Table.Th className="text-right">Variance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(report.lines || report.budget.lines || []).map((line: any) => (
                    <Table.Tr key={line.id}>
                      <Table.Td className="uppercase text-xs">{line.section || "-"}</Table.Td>
                      <Table.Td>{line.group_name || "-"}</Table.Td>
                      <Table.Td>{line.line_label}</Table.Td>
                      <Table.Td className="text-right">{formatMoney(line.planned_amount ?? line.total_amount ?? line.amount)}</Table.Td>
                      <Table.Td className="text-right">{formatMoney(line.actual_amount ?? 0)}</Table.Td>
                      <Table.Td className="text-right">{formatMoney(line.variance_amount ?? 0)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <div className="col-span-12 xl:col-span-4 box p-5">
              <h3 className="font-medium mb-4">Portfolio</h3>
              {(report.budget.portfolio || []).length ? (
                <div className="space-y-3 text-sm">
                  {report.budget.portfolio.map((entry: any) => (
                    <div key={entry.id} className="border rounded-md p-3">
                      <div className="font-medium">{entry.funder_name || `Project ${entry.project_id}`}</div>
                      <div className="text-slate-500 mt-1">Total: {formatMoney(entry.total_budget || entry.period_total || 0)}</div>
                      {entry.status ? <div className="text-slate-500 mt-1 uppercase text-xs">{entry.status}</div> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No project/programme allocation has been captured yet.</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

export default FinanceBudgetVsActualPage;
