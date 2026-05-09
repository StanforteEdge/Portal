import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  TextAreaField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getPayrollRun,
  approvePayrollRun,
  rejectPayrollRun,
  reviewPayrollRun,
  payPayrollRun,
  closePayrollRun,
  reopenPayrollRun,
  downloadMonthlyBreakdown,
} from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(status: string): "neutral" | "warning" | "success" | "danger" {
  switch (status) {
    case "submitted": return "warning";
    case "reviewed": return "warning";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

export default function FinancePayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [acting, setActing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: run, loading, refetch } = useCachedQuery(
    `finance:payroll:run:${id}`,
    () => getPayrollRun(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  async function act(
    action: string,
    fn: () => Promise<unknown>,
    successMsg: string,
  ) {
    setActing(action);
    try {
      await fn();
      showToast({ message: successMsg, tone: "success" });
      setNote("");
      refetch();
    } catch {
      showToast({ message: `Failed to ${action} run`, tone: "danger" });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="finance-payroll"
        user={{ name: userName, role: "Finance Staff" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="finance-payroll"
        user={{ name: userName, role: "Finance Staff" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <EmptyState title="Run not found" description="This payroll run does not exist." />
      </AppShell>
    );
  }

  const period = `${MONTH_NAMES[run.period_month] ?? run.period_month} ${run.period_year}`;
  const items = run.items ?? [];

  const canReview = run.status === "submitted";
  const canApprove = run.status === "reviewed" || run.status === "submitted";
  const canReject = ["submitted", "reviewed", "approved"].includes(run.status);
  const canPay = run.status === "authorized";
  const canClose = run.status === "paid";
  const canReopen = run.status === "rejected" || run.status === "closed";

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
        breadcrumbs={[
          { label: "Financial", path: "/finance" },
          { label: "Payroll", path: "/finance/payroll" },
          { label: run.name },
        ]}
        title={run.name}
        description={`${period} · ${run.currency}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canReview && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "review"}
                onClick={() =>
                  act("review", () => reviewPayrollRun(id!, note || undefined), "Run marked as reviewed")
                }
              >
                {acting === "review" ? "Reviewing..." : "Mark Reviewed"}
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "approve"}
                onClick={() =>
                  act("approve", () => approvePayrollRun(id!, note || undefined), "Run approved")
                }
              >
                {acting === "approve" ? "Approving..." : "Approve"}
              </Button>
            )}
            {canPay && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "pay"}
                onClick={() =>
                  act("pay", () => payPayrollRun(id!, { note: note || undefined }), "Run marked as paid")
                }
              >
                {acting === "pay" ? "Processing..." : "Mark as Paid"}
              </Button>
            )}
            {canClose && (
              <Button
                size="sm"
                variant="ghost"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "close"}
                onClick={() =>
                  act("close", () => closePayrollRun(id!, note || undefined), "Run closed")
                }
              >
                Close Run
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={acting === "export"}
              onClick={async () => {
                setActing("export");
                try {
                  const result = await downloadMonthlyBreakdown(id!);
                  const bytes = Uint8Array.from(atob(result.content_base64), (c) => c.charCodeAt(0));
                  const blob = new Blob([bytes], { type: result.mime_type });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = result.file_name;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  toast({ title: "Export failed", variant: "error" });
                } finally {
                  setActing(null);
                }
              }}
            >
              {acting === "export" ? "Exporting..." : "Export Breakdown"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Status"
            value={run.status}
            tone={runStatusTone(run.status)}
            icon="info"
          />
          <StatCard
            label="Workers"
            value={String(run.worker_count ?? items.length)}
            tone="neutral"
            icon="group"
          />
          <StatCard
            label="Total Net Pay"
            value={
              run.total_net != null
                ? formatCurrency(run.total_net, run.currency)
                : "-"
            }
            tone="neutral"
            icon="payments"
          />
        </div>

        {run.status === "approved" && (
          <SectionCard title="Authorization Required">
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <span className="material-symbols-outlined text-amber-600">pending</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Awaiting ED/COO Authorization</p>
                <p className="mt-0.5 text-sm text-amber-700">
                  This run has been approved but requires authorization from the ED or COO before you can mark it as paid.
                </p>
              </div>
            </div>
          </SectionCard>
        )}
        {run.status === "authorized" && (
          <SectionCard title="Authorization">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <span className="material-symbols-outlined text-green-600">verified</span>
              <div>
                <p className="text-sm font-semibold text-green-900">Authorized for Payment</p>
                <p className="mt-0.5 text-sm text-green-700">
                  ED/COO authorization confirmed. You can now mark this run as paid.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Review Note">
          <TextAreaField
            label="Note (optional — attached to any action you take above)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for HR or the audit trail..."
          />
        </SectionCard>

        <SectionCard title="Payroll Items" description="Employee breakdown for this run.">
          {items.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Gross Pay</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {item.worker_name ?? "-"}
                      </p>
                    </TableCell>
                    <TableCell>{formatCurrency(item.gross_pay, run.currency)}</TableCell>
                    <TableCell>{formatCurrency(item.total_deductions, run.currency)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(item.net_pay, run.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={item.payment_status === "paid" ? "success" : "neutral"}
                      >
                        {item.payment_status ?? "pending"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No items" description="No payroll items found for this run." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}