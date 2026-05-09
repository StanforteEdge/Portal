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

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminPayrollAuthorizationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "admin:payroll:runs",
    () => listPayrollRuns({ per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.items ?? [];
  const pendingAuth = allRuns.filter((r) => r.status === "approved");
  const authorized = allRuns.filter((r) => r.status === "authorized");
  const paid = allRuns.filter((r) => r.status === "paid" && r.year === new Date().getFullYear());

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Executive";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-payroll-auth"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Executive",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration", path: "/admin" }, { label: "Payroll Authorization" }]}
        title="Payroll Authorization"
        description="Finance-approved runs awaiting your authorization before payment can proceed."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Awaiting Authorization" value={String(pendingAuth.length)} tone="warning" icon="pending_actions" />
          <StatCard label="Authorized (pending payment)" value={String(authorized.length)} tone="success" icon="verified" />
          <StatCard label={`Paid (${new Date().getFullYear()})`} value={String(paid.length)} tone="neutral" icon="payments" />
        </div>

        {pendingAuth.length > 0 && (
          <SectionCard title="Awaiting Your Authorization" description="These runs have been approved by Finance and require your sign-off before payment.">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Run Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingAuth.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/admin/payroll/authorize/${run.id}`)}
                      >
                        Review & Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        <SectionCard title="All Payroll Runs" description="Full history of payroll runs.">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : allRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Run Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {allRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={
                          run.status === "authorized" || run.status === "paid"
                            ? "success"
                            : run.status === "approved"
                            ? "warning"
                            : run.status === "rejected"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {run.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/payroll/authorize/${run.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No payroll runs" description="No runs have been submitted yet." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
