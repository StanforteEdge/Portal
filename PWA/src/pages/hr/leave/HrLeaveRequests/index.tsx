import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listRequests, type RequestRecord } from "@/services/requests";
import { formatDisplayDate, formatPersonName, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

const pendingStatuses = new Set(["draft", "sent", "approval"]);
const approvedStatuses = new Set(["cleared", "approved", "completed"]);

function isLeaveRequest(request: RequestRecord) {
  const categoryKey = String(request.request_type?.category_key ?? "").toLowerCase();
  const typeName = String(request.request_type?.name ?? "").toLowerCase();
  return categoryKey.includes("leave") || typeName.includes("leave");
}

function HrLeaveRequestsPage() {
  const [allRows, setAllRows] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const load = async () => {
    try {
      setLoading(true);
      const rows = await listRequests();
      setAllRows((rows || []).filter(isLeaveRequest));
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load leave requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const requestData = (row.data || {}) as Record<string, unknown>;
      const dueDate = typeof requestData.due_date === "string" ? requestData.due_date : "";
      const reason = String(requestData.leave_reason ?? requestData.reason_for_leave ?? requestData.purpose ?? "");
      const requester = `${row.creator?.first_name ?? ""} ${row.creator?.last_name ?? ""} ${row.creator?.email ?? ""}`;

      const statusOk = !status || String(row.status).toLowerCase() === status;
      const searchOk =
        !query ||
        row.request_number.toLowerCase().includes(query) ||
        reason.toLowerCase().includes(query) ||
        requester.toLowerCase().includes(query) ||
        dueDate.toLowerCase().includes(query);

      return statusOk && searchOk;
    });
  }, [allRows, search, status]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const row of filteredRows) {
      const current = String(row.status).toLowerCase();
      if (pendingStatuses.has(current)) pending += 1;
      else if (approvedStatuses.has(current)) approved += 1;
      else if (current === "rejected" || current === "cancelled") rejected += 1;
    }
    return {
      total: filteredRows.length,
      pending,
      approved,
      rejected,
    };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, search, perPage]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Leave Requests</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
      <div className="mt-4 intro-y">
        <div className="box p-2">
          <div className="flex gap-2">
            <Link to="/app/hr/leave">
              <Button variant="outline-secondary">
                <Lucide icon="BarChart2" className="w-4 h-4 mr-1" />
                Tracker
              </Button>
            </Link>
            <Button variant="primary">
              <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" />
              Requests
            </Button>
            <Link to="/app/hr/settings?tab=leave">
              <Button variant="outline-secondary">
                <Lucide icon="Settings" className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Total", value: stats.total, icon: "ListChecks", color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: "Clock3", color: "text-warning" },
          { label: "Approved", value: stats.approved, icon: "CheckCircle2", color: "text-success" },
          { label: "Rejected", value: stats.rejected, icon: "XCircle", color: "text-danger" },
        ].map((card) => (
          <div key={card.label} className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div
              className={clsx([
                "relative zoom-in",
                "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
              ])}
            >
              <div className="p-5 box">
                <div className="flex">
                  <Lucide icon={card.icon as any} className={clsx("w-[28px] h-[28px]", card.color)} />
                </div>
                <div className="mt-6 text-3xl font-medium leading-8">{card.value}</div>
                <div className="mt-1 text-base text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="box mt-5">
        <div className="p-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <FormLabel>Search</FormLabel>
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Request no, reason, requester"
              />
            </div>
            <div className="min-w-[180px]">
              <FormLabel>Status</FormLabel>
              <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="approval">approval</option>
                <option value="cleared">cleared</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="cancelled">cancelled</option>
                <option value="completed">completed</option>
              </FormSelect>
            </div>
            <div className="min-w-[120px]">
              <FormLabel>Per Page</FormLabel>
              <FormSelect value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 rounded bg-slate-200"></div>
              <div className="h-4 rounded bg-slate-100"></div>
              <div className="h-4 rounded bg-slate-100"></div>
            </div>
          ) : (
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Request No</Table.Th>
                  <Table.Th>Requester</Table.Th>
                  <Table.Th>Leave Type</Table.Th>
                  <Table.Th>Period</Table.Th>
                  <Table.Th>Days</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageData.map((row) => {
                  const requestData = (row.data || {}) as Record<string, unknown>;
                  const leaveType = String(requestData.leave_type_key ?? requestData.leave_type ?? "annual_leave")
                    .replaceAll("_", " ");
                  const startDate = formatDisplayDate(
                    typeof requestData.start_date === "string" ? requestData.start_date : null
                  );
                  const endDate = formatDisplayDate(
                    typeof requestData.end_date === "string" ? requestData.end_date : null
                  );
                  return (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Link className="font-semibold text-primary hover:underline" to={`/app/requests/request/${row.id}`}>
                          {formatRequestNumber(row.request_number)}
                        </Link>
                      </Table.Td>
                      <Table.Td>
                        <div className="font-medium">{formatPersonName(row.creator)}</div>
                        <div className="text-xs text-slate-500">{row.creator?.email || "-"}</div>
                      </Table.Td>
                      <Table.Td className="capitalize">{leaveType}</Table.Td>
                      <Table.Td>{`${startDate} - ${endDate}`}</Table.Td>
                      <Table.Td>{Number(requestData.days_requested ?? 0) || "-"}</Table.Td>
                      <Table.Td>
                        <span className={clsx("inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize", statusBadgeClass(row.status))}>
                          {row.status}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        <Link to={`/app/requests/request/${row.id}`}>
                          <Button size="sm" variant="outline-secondary">
                            <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {!loading && pageData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-center text-slate-500 py-8">
                      No leave requests found.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-200/60 dark:border-darkmode-400">
          <div className="text-slate-500 text-sm">
            Showing {pageData.length} of {filteredRows.length} leave requests
          </div>
          <Pagination>
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
              <Lucide icon="ChevronLeft" className="w-4 h-4" />
            </Pagination.Link>
            <Pagination.Link active>{currentPage}</Pagination.Link>
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
              <Lucide icon="ChevronRight" className="w-4 h-4" />
            </Pagination.Link>
          </Pagination>
        </div>
      </div>
    </>
  );
}

export default HrLeaveRequestsPage;
