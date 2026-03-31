import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { approveRequest, listApprovals, rejectRequest, type RequestRecord } from "@/services/requests";
import { formatDisplayDate, formatMoney, formatPersonName, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

function RequestApprovalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = (searchParams.get("kind") || "all").toLowerCase();
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return allRequests.filter((req) => {
      const requestType = String(req.request_type?.name || "");
      const categoryKey = String(req.request_type?.category_key || "").toLowerCase();
      const isLeave = categoryKey.includes("leave") || requestType.toLowerCase().includes("leave");
      const requestPurpose = String(((req.data || {}) as Record<string, unknown>).purpose || "");
      const statusOk = !status || req.approval_view_status === status;
      const kindOk = kind === "all" ? true : kind === "leave" ? isLeave : !isLeave;
      const searchOk =
        !searchText ||
        req.request_number.toLowerCase().includes(searchText) ||
        requestType.toLowerCase().includes(searchText) ||
        requestPurpose.toLowerCase().includes(searchText) ||
        String(req.creator?.email || "").toLowerCase().includes(searchText);
      return statusOk && searchOk && kindOk;
    });
  }, [allRequests, status, search, kind]);

  const pendingCount = useMemo(
    () => filteredRequests.filter((req) => req.approval_view_status === "pending").length,
    [filteredRequests]
  );
  const approvedCount = useMemo(
    () => filteredRequests.filter((req) => req.approval_view_status === "approved").length,
    [filteredRequests]
  );

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRequests.slice(start, start + perPage);
  }, [filteredRequests, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / perPage));

  const load = async () => {
    try {
      setLoading(true);
      const data = await listApprovals();
      setAllRequests(data);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load approval queue.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setActingId(id);
      if (action === "approve") {
        await approveRequest(id, "Approved from approvals queue");
      } else {
        const comment = window.prompt("Rejection reason");
        if (!comment) return;
        await rejectRequest(id, comment);
      }
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || `Unable to ${action} request.`,
      });
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, search, perPage]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Approvals</h2>
      </div>
      <div className="flex gap-2 mt-4">
        {[
          { key: "all", label: "All" },
          { key: "financial", label: "Financial" },
          { key: "leave", label: "Leave" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              if (tab.key === "all") next.delete("kind");
              else next.set("kind", tab.key);
              setSearchParams(next);
            }}
            className={clsx(
              "px-3 py-2 text-sm rounded border",
              kind === tab.key || (tab.key === "all" && !searchParams.get("kind"))
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-700 border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Total", value: filteredRequests.length, icon: "ListChecks", color: "text-primary" },
          { label: "Pending", value: pendingCount, icon: "Clock3", color: "text-warning" },
          { label: "Approved", value: approvedCount, icon: "CheckCircle2", color: "text-success" },
          { label: "Reviewed", value: filteredRequests.length - pendingCount, icon: "Inbox", color: "text-pending" },
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

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5">
        <div className="p-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <div className="flex flex-wrap items-end justify-center gap-3">
            <div className="min-w-[220px]">
              <FormLabel>Search</FormLabel>
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Request no, type, purpose, requester"
              />
            </div>
            <div className="min-w-[200px]">
              <FormLabel>Status</FormLabel>
              <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All views</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </FormSelect>
            </div>
            <div className="min-w-[140px]">
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
                  <Table.Th>Kind</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Leave</Table.Th>
                  <Table.Th>Requester</Table.Th>
                  <Table.Th>Due Date</Table.Th>
                  <Table.Th>My View</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageData.map((req) => {
                  const data = (req.data || {}) as Record<string, unknown>;
                  const isLeave =
                    String(req.request_type?.category_key ?? "").toLowerCase().includes("leave") ||
                    String(req.request_type?.name ?? "").toLowerCase().includes("leave");
                  return (
                    <Table.Tr key={req.id}>
                      <Table.RowHeader>
                        <Link className="font-semibold text-primary hover:underline" to={`/app/requests/request/${req.id}`}>
                          {formatRequestNumber(req.request_number)}
                        </Link>
                      </Table.RowHeader>
                      <Table.Td className="capitalize">{isLeave ? "Leave" : "Financial"}</Table.Td>
                      <Table.Td>{req.request_type?.name || "-"}</Table.Td>
                      <Table.Td>{formatMoney(req.total_amount)}</Table.Td>
                      <Table.Td>
                        {isLeave ? (
                          <div className="text-xs leading-5">
                            <div>{Number(data.days_requested ?? 0)} day(s)</div>
                            <div>
                              {formatDisplayDate(typeof data.start_date === "string" ? data.start_date : null)} -{" "}
                              {formatDisplayDate(typeof data.end_date === "string" ? data.end_date : null)}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </Table.Td>
                      <Table.Td>
                        <div className="font-medium">{formatPersonName(req.creator)}</div>
                        <div className="text-xs text-slate-500">{req.creator?.email || "-"}</div>
                      </Table.Td>
                      <Table.Td>
                        {formatDisplayDate(typeof data.due_date === "string" ? data.due_date : null)}
                      </Table.Td>
                      <Table.Td>
                        <span className={clsx("inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize", statusBadgeClass(req.approval_view_status || "pending"))}>
                          {req.approval_view_status || "pending"}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        {req.approval_view_status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline-primary" disabled={actingId === req.id} onClick={() => void handleAction(req.id, "approve")}>
                              <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline-danger" disabled={actingId === req.id} onClick={() => void handleAction(req.id, "reject")}>
                              <Lucide icon="XCircle" className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Link to={`/app/requests/request/${req.id}`}>
                            <Button size="sm" variant="outline-secondary">
                              <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-200/60 dark:border-darkmode-400">
          <div className="text-slate-500 text-sm">
            Showing {pageData.length} of {filteredRequests.length} approvals
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

export default RequestApprovalsPage;
