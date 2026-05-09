import { useState } from "react";
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

function runStatusTone(status: string): "neutral" | "warning" | "success" | "danger" {
  switch (status) {
    case "draft": return "neutral";
    case "generated": return "neutral";
    case "submitted": return "warning";
    case "reviewed": return "warning";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

function periodLabel(run: any) {
  return `${MONTH_NAMES[run.month] ?? run.month} ${run.year}`;
}

export default function HrPayrollPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "hr:payroll:runs",
    () => listPayrollRuns({ per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.items ?? [];

  const pendingSubmission = allRuns.filter((r) =>
    r.status === "draft" || r.status === "generated",
  ).length;
  const awaitingApproval = allRuns.filter((r) =>
    r.status === "submitted" || r.status === "reviewed" || r.status === "approved",
  ).length;
  const paidThisYear = allRuns.filter((r) =>
    r.status === "paid" && r.year === new Date().getFullYear(),
  ).length;

  const filteredRuns =
    statusFilter === "all"
      ? allRuns
      : allRuns.filter((r) => r.status === statusFilter);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Payroll" }]}
        title="Payroll"
        description="Create and submit payroll runs for Finance approval."
        actions={
          <Button
            size="sm"
            requiredPermissions={["payroll.manage"]}
            onClick={() => navigate("/hr/payroll/runs/new")}
          >
            New Payroll Run
          </Button>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Draft / Generated"
            value={String(pendingSubmission)}
            tone="neutral"
            icon="edit_note"
          />
          <StatCard
            label="Awaiting Finance Approval"
            value={String(awaitingApproval)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label={`Paid Runs (${new Date().getFullYear()})`}
            value={String(paidThisYear)}
            tone="success"
            icon="payments"
          />
        </div>

        <SectionCard
          title="Payroll Runs"
          description="All runs you have created. Submit a generated run to send it to Finance for approval."
        >
          <div className="mb-4">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="generated">Generated</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Under Review</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </SelectField>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading runs...</div>
          ) : filteredRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Gross</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {filteredRuns.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>{periodLabel(run)}</TableCell>
                    <TableCell>{run.item_count ?? "-"}</TableCell>
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
                      <Chip variant={runStatusTone(run.status)}>
                        {run.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/hr/payroll/runs/${run.id}`)}
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
              description="Create a new payroll run to get started."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}