import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getPayrollReportsOverview } from "@/services/payroll";
import { formatMoney } from "@/utils/formatting";

function FinancePayrollReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [report, setReport] = useState<any | null>(null);

  const load = async (targetYear = year) => {
    try {
      setLoading(true);
      setReport(await getPayrollReportsOverview({ year: targetYear }));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll reports." });
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
        <h2 className="mr-auto text-lg font-medium">Payroll Reports</h2>
        <div className="flex items-end gap-2">
          <div>
            <FormLabel>Year</FormLabel>
            <FormInput type="number" value={year} onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))} className="w-28" />
          </div>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-5">
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Gross</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(report?.summary?.gross || 0)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Deductions</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(report?.summary?.deductions || 0)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Net</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(report?.summary?.net || 0)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Employer Cost</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(report?.summary?.employer_cost || 0)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Workers Processed</div>
          <div className="text-2xl font-semibold mt-2">{report?.summary?.worker_count || 0}</div>
          <div className="text-xs text-slate-500 mt-1">{report?.active_workers?.employees || 0} employees · {report?.active_workers?.consultants || 0} consultants</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="font-medium">Monthly Payroll Trend</div>
          <div className="mt-4 max-h-[420px] overflow-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Month</Table.Th>
                  <Table.Th className="text-right">Gross</Table.Th>
                  <Table.Th className="text-right">Net</Table.Th>
                  <Table.Th className="text-right">Workers</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(report?.monthly || []).map((row: any) => (
                  <Table.Tr key={row.month}>
                    <Table.Td>{row.month}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(row.gross || 0)}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(row.net || 0)}</Table.Td>
                    <Table.Td className="text-right">{row.worker_count || 0}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div className="box p-5">
          <div className="font-medium">Worker Type Split</div>
          <div className="mt-4 max-h-[420px] overflow-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th className="text-right">Gross</Table.Th>
                  <Table.Th className="text-right">Net</Table.Th>
                  <Table.Th className="text-right">Count</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(report?.worker_type_totals || []).map((row: any) => (
                  <Table.Tr key={row.worker_type}>
                    <Table.Td className="capitalize">{row.worker_type}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(row.gross || 0)}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(row.net || 0)}</Table.Td>
                    <Table.Td className="text-right">{row.count || 0}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="font-medium">By Organization</div>
          <div className="mt-4 max-h-[360px] overflow-auto space-y-3">
            {(report?.organization_totals || []).map((row: any, index: number) => (
              <div key={`${row.label}-${index}`} className="rounded border p-3">
                <div className="font-medium">{row.label}</div>
                <div className="text-sm text-slate-500 mt-1">Gross {formatMoney(row.gross || 0)} · Net {formatMoney(row.net || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="box p-5">
          <div className="font-medium">By Fund</div>
          <div className="mt-4 max-h-[360px] overflow-auto space-y-3">
            {(report?.fund_totals || []).map((row: any, index: number) => (
              <div key={`${row.label}-${index}`} className="rounded border p-3">
                <div className="font-medium">{row.label}</div>
                <div className="text-sm text-slate-500 mt-1">Gross {formatMoney(row.gross || 0)} · Net {formatMoney(row.net || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="box p-5">
          <div className="font-medium">By Grant</div>
          <div className="mt-4 max-h-[360px] overflow-auto space-y-3">
            {(report?.grant_totals || []).map((row: any, index: number) => (
              <div key={`${row.label}-${index}`} className="rounded border p-3">
                <div className="font-medium">{row.label}</div>
                <div className="text-sm text-slate-500 mt-1">Gross {formatMoney(row.gross || 0)} · Net {formatMoney(row.net || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="box p-5">
          <div className="font-medium">Payment Status</div>
          <div className="mt-4 max-h-[360px] overflow-auto space-y-3">
            {(report?.payment_status_counts || []).map((row: any) => (
              <div key={row.status} className="rounded border p-3 flex items-center justify-between">
                <div className="capitalize">{String(row.status || "").replaceAll("_", " ")}</div>
                <div className="font-medium">{row.count || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default FinancePayrollReportsPage;
