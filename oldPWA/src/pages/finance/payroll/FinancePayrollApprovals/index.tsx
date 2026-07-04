import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { approvePayrollRun, listPayrollRuns, rejectPayrollRun, reviewPayrollRun } from "@/services/payroll";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinancePayrollApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [review, approved, rejected] = await Promise.all([
        listPayrollRuns({ page: 1, per_page: 100, status: "under_review" }),
        listPayrollRuns({ page: 1, per_page: 100, status: "approved" }),
        listPayrollRuns({ page: 1, per_page: 100, status: "rejected" }),
      ]);
      setRows([...(review.data || []), ...(approved.data || []), ...(rejected.data || [])]);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll approval queue." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      await action();
      setNotice({ tone: "success", message: successMessage });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Action failed." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Approval Queue</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Run</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Net</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.item_count || 0} workers</div>
                </Table.Td>
                <Table.Td>{formatDisplayDate(row.period_start)} - {formatDisplayDate(row.period_end)}</Table.Td>
                <Table.Td className="capitalize">{row.status.replaceAll("_", " ")}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.totals?.net || 0)}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    {row.status !== "under_review" ? (
                      <Button size="sm" variant="outline-primary" onClick={() => void runAction(() => reviewPayrollRun(row.id), "Payroll run moved to review.")}>
                        Review
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline-success" onClick={() => void runAction(() => approvePayrollRun(row.id), "Payroll run approved.")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => void runAction(() => rejectPayrollRun(row.id), "Payroll run rejected.")}>
                      Reject
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center text-slate-500 py-10">No payroll runs waiting for review.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default FinancePayrollApprovalsPage;
