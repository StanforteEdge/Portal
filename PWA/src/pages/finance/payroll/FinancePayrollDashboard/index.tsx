import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getPayrollSummary, type PayrollSummary } from "@/services/payroll";
import { formatMoney } from "@/utils/formatting";

function FinancePayrollDashboardPage() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setSummary(await getPayrollSummary());
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load payroll summary.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const latestRun = summary?.latest_run;

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Dashboard</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-5">
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Workers</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.workers ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">{summary?.active_workers ?? 0} active</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Consultants</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.consultants ?? 0}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Components</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.active_components ?? 0}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Runs</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.runs ?? 0}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Latest Net Pay</div>
          <div className="text-2xl font-semibold mt-2">
            {loading ? "..." : formatMoney(latestRun?.totals.net ?? 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{latestRun ? `${latestRun.name} • ${latestRun.status}` : "No runs yet"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="font-medium">Latest Payroll Run</div>
          {latestRun ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Run</span>
                <span className="font-medium text-slate-800">{latestRun.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Period</span>
                <span className="font-medium text-slate-800">
                  {latestRun.month}/{latestRun.year}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium text-slate-800 capitalize">{latestRun.status.replaceAll("_", " ")}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded border p-3">
                  <div className="text-xs text-slate-500">Gross</div>
                  <div className="font-medium">{formatMoney(latestRun.totals.gross)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-slate-500">Deductions</div>
                  <div className="font-medium">{formatMoney(latestRun.totals.deductions)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-slate-500">Employer Cost</div>
                  <div className="font-medium">{formatMoney(latestRun.totals.employer_cost)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-slate-500">Net</div>
                  <div className="font-medium">{formatMoney(latestRun.totals.net)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">No payroll run has been generated yet.</div>
          )}
        </div>

        <div className="box p-5">
          <div className="font-medium">Quick Links</div>
          <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/workers">
              <Lucide icon="Users" className="w-4 h-4 mr-2" />
              Payroll Workers
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/inbox">
              <Lucide icon="Inbox" className="w-4 h-4 mr-2" />
              Payroll Inbox
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/notification-preferences">
              <Lucide icon="Bell" className="w-4 h-4 mr-2" />
              Notification Preferences
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/components">
              <Lucide icon="ListChecks" className="w-4 h-4 mr-2" />
              Components
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/runs">
              <Lucide icon="Wallet" className="w-4 h-4 mr-2" />
              Payroll Runs
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/approvals">
              <Lucide icon="ListChecks" className="w-4 h-4 mr-2" />
              Approval Queue
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/settings">
              <Lucide icon="Settings" className="w-4 h-4 mr-2" />
              Payroll Settings
            </Link>
            <Link className="btn btn-outline-primary justify-start" to="/app/finance/payroll/reports">
              <Lucide icon="BarChart2" className="w-4 h-4 mr-2" />
              Payroll Reports
            </Link>
            <Link className="btn btn-outline-secondary justify-start" to="/app/help/finance#payroll">
              <Lucide icon="HelpCircle" className="w-4 h-4 mr-2" />
              Payroll Guide
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default FinancePayrollDashboardPage;
