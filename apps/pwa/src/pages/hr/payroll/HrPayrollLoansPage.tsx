import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";
import {
  deriveRequestWorkflowStatus,
  formatPersonName,
  requestStatusTone,
} from "@/pages/requests/request-helpers";
import { listHrLoanRequests, listHrLoanApprovals, type RequestRecord } from "./hr-loans-api";

type Tab = "inbox" | "all";

function loanAmount(r: RequestRecord) {
  return Number(r.total_amount ?? r.request_total_amount ?? (r.data as any)?.loan_amount ?? 0);
}

function repaymentPeriod(r: RequestRecord) {
  return Number((r.data as any)?.repayment_period_months ?? (r.data as any)?.repayment_months ?? 0);
}

function monthlyInstallment(r: RequestRecord) {
  const amt = loanAmount(r);
  const period = repaymentPeriod(r);
  return period > 0 ? amt / period : 0;
}

function loanStatusLabel(r: RequestRecord) {
  const ws = deriveRequestWorkflowStatus(r);
  if (ws === "approved") return "Approved";
  if (ws === "completed") return "Completed";
  if (ws === "rejected") return "Rejected";
  if (ws === "returned") return "Returned";
  if (ws === "submitted") return "Pending Approval";
  if (ws === "draft") return "Draft";
  return String(r.status ?? ws ?? "").replaceAll("_", " ");
}

export default function HrPayrollLoansPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("inbox");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: allLoansData, loading: loadingAll } = useCachedQuery(
    "hr:loans:all",
    () => listHrLoanRequests(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );
  const allLoans: RequestRecord[] = allLoansData ?? [];

  const { data: inboxLoansData, loading: loadingInbox } = useCachedQuery(
    "hr:loans:inbox",
    () => listHrLoanApprovals(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );
  const inboxLoans: RequestRecord[] = inboxLoansData ?? [];

  const stats = useMemo(() => {
    const pendingApproval = allLoans.filter((r) => {
      const ws = deriveRequestWorkflowStatus(r);
      return ws === "submitted" || ws === "pending";
    }).length;
    const active = allLoans.filter((r) => {
      const ws = deriveRequestWorkflowStatus(r);
      return ws === "approved";
    }).length;
    const completed = allLoans.filter((r) => deriveRequestWorkflowStatus(r) === "completed").length;
    const totalDisbursed = allLoans
      .filter((r) => {
        const ws = deriveRequestWorkflowStatus(r);
        return ws === "approved" || ws === "completed";
      })
      .reduce((sum, r) => sum + loanAmount(r), 0);
    return { pendingApproval, active, completed, totalDisbursed };
  }, [allLoans]);

  const visibleLoans = useMemo(() => {
    const source = tab === "inbox" ? inboxLoans : allLoans;
    if (statusFilter === "all") return source;
    return source.filter((r) => {
      const ws = deriveRequestWorkflowStatus(r);
      return ws === statusFilter;
    });
  }, [tab, inboxLoans, allLoans, statusFilter]);

  const loading = tab === "inbox" ? loadingInbox : loadingAll;
  const currency = allLoans[0]?.currency ?? undefined;

  const userName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll-loans"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title ?? "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Payroll", path: "/hr/payroll" }, { label: "Loans" }]}
        title="Loans Management"
        description="Review, approve, and track staff loan requests."
        actions={
          <Button size="sm" onClick={() => window.location.assign("/requests/new/form?category=loan")}>
            New Loan Request
          </Button>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Approval" value={String(stats.pendingApproval)} tone="warning" icon="pending_actions" />
          <StatCard label="Active Loans" value={String(stats.active)} tone="neutral" icon="credit_score" />
          <StatCard label="Completed" value={String(stats.completed)} tone="success" icon="task_alt" />
          <StatCard label="Total Disbursed" value={formatCurrency(stats.totalDisbursed, currency)} tone="neutral" icon="payments" />
        </div>

        <SectionCard
          title={tab === "inbox" ? "Inbox — Needs Your Action" : "All Loan Requests"}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("inbox")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${tab === "inbox" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Inbox {inboxLoans.length > 0 ? `(${inboxLoans.length})` : ""}
              </button>
              <button
                onClick={() => setTab("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${tab === "all" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                All Loans
              </button>
            </div>
          }
        >
          {tab === "all" && (
            <div className="mb-4 max-w-xs">
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Pending Approval</option>
                <option value="approved">Approved / Active</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </SelectField>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-sm text-slate-500">Loading loans…</div>
          ) : visibleLoans.length === 0 ? (
            <EmptyState
              title={tab === "inbox" ? "No loans awaiting your action" : "No loan requests found"}
              description={tab === "inbox" ? "You're all caught up." : "Loan requests will appear here once submitted."}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Employee</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                    <TableHeaderCell>Period</TableHeaderCell>
                    <TableHeaderCell>Monthly</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Submitted</TableHeaderCell>
                    <TableHeaderCell>{""}</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {visibleLoans.map((r) => {
                    const period = repaymentPeriod(r);
                    const monthly = monthlyInstallment(r);
                    const ws = deriveRequestWorkflowStatus(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{formatPersonName(r.creator)}</p>
                          {r.request_number && (
                            <p className="text-xs text-slate-400">{r.request_number}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {r.request_type?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-900">
                          {formatCurrency(loanAmount(r), r.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {period > 0 ? `${period} month${period === 1 ? "" : "s"}` : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {monthly > 0 ? formatCurrency(monthly, r.currency) : "-"}
                        </TableCell>
                        <TableCell>
                          <Chip variant={requestStatusTone(ws)}>{loanStatusLabel(r)}</Chip>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {r.created_at ? formatDisplayDate(r.created_at) : "-"}
                        </TableCell>
                        <TableCell>
                          <Link to={`/requests/${r.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
