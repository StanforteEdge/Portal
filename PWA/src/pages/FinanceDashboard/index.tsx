import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getFinanceSummary, type FinanceSummary } from "@/services/finance";

function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setSummary(await getFinanceSummary());
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load finance summary.",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Dashboard</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-3">
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Total Requests</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.total_requests ?? 0}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Total Amount</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.total_amount ?? 0}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Average Amount</div>
          <div className="text-2xl font-semibold mt-2">{loading ? "..." : summary?.average_amount ?? 0}</div>
        </div>
      </div>
      <div className="box mt-5 p-5">
        <div className="font-medium mb-3">Quick Links</div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="/app/finance/requests">
            Open Finance Requests
          </Link>
          <Link className="btn btn-outline-secondary" to="/app/finance/settings">
            Finance Settings
          </Link>
        </div>
      </div>
    </>
  );
}

export default FinanceDashboardPage;
