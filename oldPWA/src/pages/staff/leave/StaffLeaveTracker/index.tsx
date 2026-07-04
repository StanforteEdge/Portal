import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getMyLeaveBalance, listRequests, type RequestRecord } from "@/services/requests";
import { formatDisplayDate } from "@/utils/formatting";

type LeaveBalanceSummary = {
  leave_type_key: string;
  entitled_days: number;
  ledger_delta_days: number;
  available_days: number;
};

function StaffLeaveTrackerPage() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<LeaveBalanceSummary[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [balanceData, requestRows] = await Promise.all([
        getMyLeaveBalance({ year }),
        listRequests({ limit: 100, only_mine: "true" }),
      ]);
      const leaveRequests = (requestRows ?? []).filter((row) => {
        const categoryKey = String(row.request_type?.category_key ?? "").toLowerCase();
        const typeName = String(row.request_type?.name ?? "").toLowerCase();
        const hasLeaveMeta = Boolean((row.data as any)?.leave_type_key);
        return categoryKey.includes("leave") || typeName.includes("leave") || hasLeaveMeta;
      });
      setSummary(balanceData.summary ?? []);
      setRequests(leaveRequests);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load leave tracker." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [year]);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, row) => {
        acc.entitled += Number(row.entitled_days || 0);
        acc.available += Number(row.available_days || 0);
        return acc;
      },
      { entitled: 0, available: 0 }
    );
  }, [summary]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Leave Tracker</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => navigate("/appOld/requests/new")}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Leave Request
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 md:col-span-4 box p-4">
          <div className="text-slate-500 text-sm">Year</div>
          <div className="text-xl font-semibold mt-2">{year}</div>
        </div>
        <div className="col-span-12 md:col-span-4 box p-4">
          <div className="text-slate-500 text-sm">Entitled Days</div>
          <div className="text-xl font-semibold mt-2">{totals.entitled}</div>
        </div>
        <div className="col-span-12 md:col-span-4 box p-4">
          <div className="text-slate-500 text-sm">Available Days</div>
          <div className="text-xl font-semibold mt-2">{totals.available}</div>
        </div>
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <div className="font-medium mb-3">Leave Balance</div>
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Leave Type</Table.Th>
              <Table.Th>Entitled</Table.Th>
              <Table.Th>Used / Delta</Table.Th>
              <Table.Th>Available</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {summary.map((row) => (
              <Table.Tr key={row.leave_type_key}>
                <Table.Td className="capitalize">{row.leave_type_key.replaceAll("_", " ")}</Table.Td>
                <Table.Td>{row.entitled_days}</Table.Td>
                <Table.Td>{row.ledger_delta_days}</Table.Td>
                <Table.Td>{row.available_days}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && summary.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center text-slate-500 py-8">No leave balance records yet.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <div className="font-medium mb-3">My Leave Requests</div>
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Request No.</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Days</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Handover</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requests.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.request_number}</Table.Td>
                <Table.Td>{row.request_type?.name ?? "-"}</Table.Td>
                <Table.Td>{Number((row.data as any)?.days_requested ?? 0)}</Table.Td>
                <Table.Td>
                  {(row.data as any)?.start_date ? formatDisplayDate((row.data as any).start_date) : "-"}{" "}
                  - {(row.data as any)?.end_date ? formatDisplayDate((row.data as any).end_date) : "-"}
                </Table.Td>
                <Table.Td>{(row.data as any)?.handover_user_id ? "Assigned" : "-"}</Table.Td>
                <Table.Td className="capitalize">{row.status}</Table.Td>
                <Table.Td>
                  <Button size="sm" variant="outline-primary" onClick={() => navigate(`/appOld/requests/request/${row.id}`)}>
                    <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && requests.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500 py-8">No leave requests found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default StaffLeaveTrackerPage;
