import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
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
import { listPayrollRuns, type PayrollRunSummary } from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" {
  switch (status) {
    case "under_review": return "warning";
    case "approved": return "success";
    case "authorized": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

function formatRunStatus(status: string) {
  switch (status) {
    case "under_review":
      return "Pending Finance Review";
    case "approved":
      return "Approved";
    case "authorized":
      return "Authorized for Payment";
    case "paid":
      return "Paid";
    case "closed":
      return "Closed";
    case "rejected":
      return "Returned to HR";
    default:
      return status;
  }
}

export default function FinancePayrollPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "finance:payroll:runs",
    () => listPayrollRuns({ per_page: 100, status_in: "under_review,approved" }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.items ?? [];

  const pendingReview = allRuns.filter((r) =>
    r.status === "under_review",
  );
  const approved = allRuns.filter((r) => r.status === "approved" || r.status === "authorized");
  const paid = allRuns.filter(
    (r) => r.status === "paid" && r.year === new Date().getFullYear(),
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Finance Staff",
      }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Financial", path: "/finance" }, { label: "Payroll" }]}
        title="Payroll Approval"
        description="Review, approve, and pay payroll runs routed from HR."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Pending Review"
            value={String(pendingReview.length)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label="Approved (pending payment)"
            value={String(approved.length)}
            tone="success"
            icon="check_circle"
          />
          <StatCard
            label={`Paid (${new Date().getFullYear()})`}
            value={String(paid.length)}
            tone="neutral"
            icon="payments"
          />
        </div>

        {pendingReview.length > 0 && (
          <SectionCard
            title="Pending Review"
            description="Runs awaiting Finance review."
          >
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingReview.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>{run.item_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.totals?.net != null
                        ? formatCurrency(run.totals.net, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={runStatusTone(run.status)}>{formatRunStatus(run.status)}</Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        requiredPermissions={["payroll.approve"]}
                        onClick={() => navigate(`/finance/payroll/runs/${run.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        <SectionCard
          title="All Payroll Runs"
          description="Full history of payroll runs visible to Finance."
        >
          {loading ? (
            <div className="text-sm text-slate-500">Loading runs...</div>
          ) : allRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Gross</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {allRuns.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>
                      {run.totals?.gross != null
                        ? formatCurrency(run.totals.gross, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {run.totals?.net != null
                        ? formatCurrency(run.totals.net, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={runStatusTone(run.status)}>{formatRunStatus(run.status)}</Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/finance/payroll/runs/${run.id}`)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No payroll runs"
              description="No payroll runs are currently visible to Finance."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
