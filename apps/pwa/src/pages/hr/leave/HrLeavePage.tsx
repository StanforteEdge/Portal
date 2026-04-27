// apps/pwa/src/modules/hr/leave/HrLeavePage.tsx
import { useState } from "react";
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
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { requestStatusTone } from "@/pages/requests/request-helpers";
import {
  listHrLeaveRequests,
  listHrLeaveApprovals,
  approveRequest,
  rejectRequest,
  type RequestRecord,
} from "./hr-leave-api";
import StaffLeaveSlideOver from "./StaffLeaveSlideOver";

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
  const now = new Date();
  const startD = new Date(start);
  const endD = new Date(end);
  return (
    record.status === "approved" &&
    now >= startD &&
    now <= endD
  );
}

export default function HrLeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [slideOver, setSlideOver] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const { data: approvals, loading: appLoading } = useCachedQuery(
    "hr:leave:approvals",
    () => listHrLeaveApprovals(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: allLeave, loading: allLoading } = useCachedQuery(
    `hr:leave:all:${statusFilter}`,
    () => listHrLeaveRequests({ status: statusFilter || undefined }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const pendingApprovals: RequestRecord[] = approvals ?? [];
  const allLeaveRequests: RequestRecord[] = allLeave ?? [];

  const currentlyOnLeave = allLeaveRequests.filter(isCurrentlyOnLeave);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  async function handleApprove(id: string) {
    try {
      setReviewLoading(true);
      await approveRequest(id, reviewComment || undefined);
      showToast({ tone: "success", title: "Leave approved", message: "Request has been approved." });
      setReviewingId(null);
      setReviewComment("");
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Approval failed",
        message: err instanceof Error ? err.message : "Unable to approve.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleReject(id: string) {
    try {
      setReviewLoading(true);
      await rejectRequest(id, reviewComment || undefined);
      showToast({ tone: "success", title: "Leave rejected", message: "Request has been rejected." });
      setReviewingId(null);
      setReviewComment("");
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Rejection failed",
        message: err instanceof Error ? err.message : "Unable to reject.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

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
        description="Review pending leave requests, track staff leave history, and see who is currently on leave."
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
          description="Leave requests awaiting your approval."
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
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingApprovals.flatMap((r) => {
                  const d = r.data ?? {};
                  const start = formatDate(String(d.start_date ?? ""));
                  const end = formatDate(String(d.end_date ?? ""));
                  const days = Number(d.days_requested ?? 0);
                  const name = creatorName(r);

                  const mainRow = (
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
                        {reviewingId !== r.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReviewingId(r.id)}
                          >
                            Review
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );

                  if (reviewingId !== r.id) return [mainRow];

                  const reviewRow = (
                    <TableRow key={`${r.id}-review`}>
                      <TableCell colSpan={6} className="bg-slate-50 px-4 py-3">
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1">
                            <TextField
                              label="Comment (optional)"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => void handleApprove(r.id)}
                            disabled={reviewLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void handleReject(r.id)}
                            disabled={reviewLoading}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReviewingId(null);
                              setReviewComment("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );

                  return [mainRow, reviewRow];
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
          description="All staff leave requests across the organisation."
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </SelectField>
          </div>

          {allLoading ? (
            <div className="text-sm text-slate-500">Loading leave history...</div>
          ) : (
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
                {allLeaveRequests.map((r) => {
                  const d = r.data ?? {};
                  const days = Number(d.days_requested ?? 0);
                  const name = creatorName(r);
                  const userId = r.creator?.id ?? "";
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
                        <Chip variant={requestStatusTone(r.status)}>
                          {r.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {userId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setSlideOver({ userId, userName: name })
                            }
                          >
                            Detail
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!allLeaveRequests.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      {slideOver ? (
        <StaffLeaveSlideOver
          userId={slideOver.userId}
          userName={slideOver.userName}
          year={currentYear}
          onClose={() => setSlideOver(null)}
        />
      ) : null}
    </AppShell>
  );
}
