// apps/pwa/src/modules/hr/leave/HrLeavePage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  PaginationControls,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  deriveRequestWorkflowStatus,
  requestStatusTone,
} from "@/pages/requests/request-helpers";
import {
  listHrLeaveRequests,
  listHrLeaveApprovals,
  listHrLeaveRequestsPaged,
  type RequestRecord,
} from "./hr-leave-api";

type HistoryFilter =
  | "approved_or_completed"
  | "approved"
  | "completed"
  | "rejected";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function creatorName(record: RequestRecord) {
  if (!record.creator) return "-";
  return (
    `${record.creator.first_name ?? ""} ${record.creator.last_name ?? ""}`.trim() ||
    record.creator.email ||
    "-"
  );
}

function isCurrentlyOnLeave(record: RequestRecord): boolean {
  const d = record.data ?? {};
  const start = String(d.start_date ?? "");
  const end = String(d.end_date ?? "");
  if (!start || !end) return false;
  const workflowStatus = deriveRequestWorkflowStatus(record);
  const now = new Date();
  const startD = new Date(start);
  const endD = new Date(end);
  return (
    ["approved", "completed"].includes(workflowStatus) &&
    now >= startD &&
    now <= endD
  );
}

function matchesHistoryFilter(record: RequestRecord, filter: HistoryFilter) {
  const workflowStatus = deriveRequestWorkflowStatus(record);
  if (filter === "approved_or_completed") {
    return workflowStatus === "approved" || workflowStatus === "completed";
  }
  return workflowStatus === filter;
}

export default function HrLeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const navigate = useNavigate();
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>(
    "approved_or_completed",
  );
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(25);

  const { data: approvals, loading: appLoading } = useCachedQuery(
    "hr:leave:approvals",
    () => listHrLeaveApprovals(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: allLeave, loading: allLoading } = useCachedQuery(
    "hr:leave:all",
    () => listHrLeaveRequests(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const queryStatusMap: Record<string, string> = {
    approved_or_completed: "cleared",
    approved: "cleared",
    completed: "cleared",
    rejected: "rejected",
  };
  const queryStatus = queryStatusMap[historyFilter] || "cleared,rejected";

  const { data: historyData, loading: historyLoading } = useCachedQuery(
    `hr:leave:history:${historyPage}:${historyPerPage}:${queryStatus}`,
    () => listHrLeaveRequestsPaged({
      status: queryStatus,
      page: historyPage,
      per_page: historyPerPage,
    }),
    { ttlMs: 1000 * 30, storage: "memory" }
  );

  const pendingApprovals: RequestRecord[] = approvals ?? [];
  const allLeaveRequests: RequestRecord[] = allLeave ?? [];
  const currentlyOnLeave = allLeaveRequests.filter(isCurrentlyOnLeave);
  const historyLeaveRequests = useMemo(() => {
    const items = historyData?.items ?? [];
    return items.filter((record) => matchesHistoryFilter(record, historyFilter));
  }, [historyData?.items, historyFilter]);

  const historySafePage = historyData?.meta?.page ?? historyPage;
  const historyTotalPages = historyData?.meta?.total_pages ?? 1;
  const historyTotalCount = historyData?.meta?.total ?? 0;

  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await listHrLeaveRequestsPaged({
        status: queryStatus,
        page: 1,
        per_page: 10000,
      });

      const records = res.items || [];
      if (records.length === 0) {
        showToast({ message: "No records to export." });
        return;
      }

      const headers = ["Staff Name", "Email", "Type", "Start Date", "End Date", "Days", "Submitted At", "Status"];
      const rows = records.map((r: any) => {
        const d = r.data ?? {};
        const workflowStatus = deriveRequestWorkflowStatus(r);
        const days = Number(d.days_requested ?? 0);
        const name = creatorName(r);
        return [
          `"${name}"`,
          `"${r.creator?.email ?? ""}"`,
          `"${r.request_type?.name ?? "Leave"}"`,
          `"${formatDate(String(d.start_date ?? ""))}"`,
          `"${formatDate(String(d.end_date ?? ""))}"`,
          days,
          `"${formatDate(r.created_at)}"`,
          `"${workflowStatus}"`,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `leave_history_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast({ message: "Failed to export CSV", tone: "danger" });
    } finally {
      setExportingCsv(false);
    }
  };

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-leave"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Leave" }]}
        title="Leave"
        description="Open pending leave requests in HR details to review and approve, then track finalized leave outcomes."
      />

      <div className="grid gap-6">
        {/* Summary stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Pending Approval"
            value={String(pendingApprovals.length)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label="Currently on Leave"
            value={String(currentlyOnLeave.length)}
            tone="neutral"
            icon="beach_access"
          />
          <StatCard
            label="Total Leave Requests"
            value={String(allLeaveRequests.length)}
            tone="neutral"
            icon="event_available"
          />
        </div>

        {/* Currently on leave */}
        {currentlyOnLeave.length > 0 ? (
          <SectionCard
            title="Currently on Leave"
            description="Staff with approved leave that overlaps with today."
          >
            <div className="flex flex-wrap gap-3">
              {currentlyOnLeave.map((r) => {
                const d = r.data ?? {};
                const end = formatDate(String(d.end_date ?? ""));
                const name = creatorName(r);
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.request_type?.name ?? "Leave"} · returns {end}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        {/* Pending approvals queue */}
        <SectionCard
          title="Pending Approvals"
          description="Open each request to review details and take approval action."
        >
          {appLoading ? (
            <div className="text-sm text-slate-500">Loading approvals...</div>
          ) : pendingApprovals.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Staff</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Dates</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell>Submitted</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingApprovals.map((r) => {
                  const d = r.data ?? {};
                  const start = formatDate(String(d.start_date ?? ""));
                  const end = formatDate(String(d.end_date ?? ""));
                  const days = Number(d.days_requested ?? 0);
                  const name = creatorName(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">
                          {r.creator?.email ?? ""}
                        </p>
                      </TableCell>
                      <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                      <TableCell>
                        {start} – {end}
                      </TableCell>
                      <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          requiredPermissions={["leave.approve"]}
                          onClick={() => navigate(`/hr/requests/${r.id}`)}
                        >
                          Open Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No pending approvals"
              description="All leave requests are up to date."
            />
          )}
        </SectionCard>

        {/* Full leave history */}
        <SectionCard
          title="Leave History"
          description="Finalized leave requests (approved/completed/rejected)."
          action={
            <Button variant="secondary" size="sm" onClick={handleExportCsv} className="gap-2" disabled={exportingCsv}>
              <span className="material-symbols-outlined text-[18px]">download</span>
              {exportingCsv ? "Exporting..." : "Export CSV"}
            </Button>
          }
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <SelectField
              label="Status"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as HistoryFilter)}
            >
              <option value="approved_or_completed">Approved + Completed</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </SelectField>
          </div>

          {historyLoading ? (
            <div className="text-sm text-slate-500">Loading leave history...</div>
          ) : (
            <div className="flex flex-col gap-4">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Staff</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>From</TableHeaderCell>
                    <TableHeaderCell>To</TableHeaderCell>
                    <TableHeaderCell>Days</TableHeaderCell>
                    <TableHeaderCell>Submitted</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>{""}</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {historyLeaveRequests.map((r) => {
                    const d = r.data ?? {};
                    const workflowStatus = deriveRequestWorkflowStatus(r);
                    const days = Number(d.days_requested ?? 0);
                    const name = creatorName(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">
                            {r.creator?.email ?? ""}
                          </p>
                        </TableCell>
                        <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                        <TableCell>{formatDate(String(d.start_date ?? ""))}</TableCell>
                        <TableCell>{formatDate(String(d.end_date ?? ""))}</TableCell>
                        <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell>
                          <Chip variant={requestStatusTone(workflowStatus)}>
                            {workflowStatus}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/hr/requests/${r.id}`)
                            }
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!historyLeaveRequests.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-slate-500"
                      >
                        No leave requests found for this status.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <SelectField
                  label=""
                  value={String(historyPerPage)}
                  onChange={(e) => {
                    setHistoryPerPage(Number(e.target.value));
                    setHistoryPage(1);
                  }}
                  className="w-32"
                >
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                </SelectField>
                <PaginationControls
                  page={historySafePage}
                  totalPages={historyTotalPages}
                  totalCount={historyTotalCount}
                  itemLabel="request"
                  onPageChange={setHistoryPage}
                />
              </div>
            </div>
          )}
        </SectionCard>
      </div>

    </AppShell>
  );
}
