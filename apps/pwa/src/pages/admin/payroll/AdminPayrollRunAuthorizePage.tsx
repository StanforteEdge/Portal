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
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getPayrollRun,
  authorizePayrollRun,
  downloadMonthlyBreakdown,
} from "@/shared/api/payroll-api";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function triggerDownload(fileName: string, mimeType: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayrollRunAuthorizePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: run, loading, refetch } = useCachedQuery(
    `admin:payroll:run:${id}`,
    () => getPayrollRun(id!),
    { ttlMs: 0, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Executive";

  async function handleAuthorize() {
    if (!id) return;
    setActing("authorize");
    try {
      await authorizePayrollRun(id, { notes: notes.trim() || undefined });
      showToast({ tone: "success", title: "Authorized", message: "Payroll run authorized. Finance can now proceed with payment." });
      setNotes("");
      refetch();
    } catch (err) {
      showToast({ tone: "danger", title: "Authorization failed", message: err instanceof Error ? err.message : "Unable to authorize." });
    } finally {
      setActing(null);
    }
  }

  async function handleExport() {
    if (!id) return;
    setActing("export");
    try {
      const result = await downloadMonthlyBreakdown(id);
      triggerDownload(result.file_name, result.mime_type, result.content_base64);
    } catch {
      showToast({ tone: "danger", title: "Export failed", message: "Unable to download breakdown." });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="admin-payroll-auth" user={{ name: userName, role: "Executive" }} mobileNav={buildAppMobileNav("Dashboard")}>
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="admin-payroll-auth" user={{ name: userName, role: "Executive" }} mobileNav={buildAppMobileNav("Dashboard")}>
        <EmptyState title="Run not found" description="This payroll run does not exist." />
      </AppShell>
    );
  }

  const canAuthorize = run.status === "approved";
  const items = run.items ?? [];
  const period = `${MONTH_NAMES[run.month] ?? run.month} ${run.year}`;

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-payroll-auth"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Executive" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Administration", path: "/admin" },
          { label: "Payroll Authorization", path: "/admin/payroll/authorization" },
          { label: run.name },
        ]}
        title={run.name}
        description={`${period} · ${run.currency}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={acting === "export"} onClick={() => void handleExport()}>
              {acting === "export" ? "Exporting..." : "Download Breakdown"}
            </Button>
            {canAuthorize && (
              <Button size="sm" disabled={acting === "authorize"} onClick={() => void handleAuthorize()}>
                {acting === "authorize" ? "Authorizing..." : "Authorize Payment"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Status" value={run.status} tone={run.status === "authorized" || run.status === "paid" ? "success" : run.status === "approved" ? "warning" : "neutral"} icon="info" />
          <StatCard label="Workers" value={String(run.worker_count ?? items.length)} tone="neutral" icon="group" />
          <StatCard label="Total Net Pay" value={run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"} tone="neutral" icon="payments" />
        </div>

        {canAuthorize && (
          <SectionCard title="Authorization">
            <div className="grid gap-4">
              <p className="text-sm text-slate-700">
                You are authorizing this payroll run for payment. Finance will be able to mark it as paid once you authorize.
                Review the breakdown below before signing off.
              </p>
              <TextField
                label="Authorization Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Approved for May cycle — all figures verified."
              />
            </div>
          </SectionCard>
        )}

        {run.status === "authorized" && (
          <SectionCard title="Authorization">
            <Chip variant="success">Authorized — Finance can proceed with payment</Chip>
          </SectionCard>
        )}

        <SectionCard title="Payroll Items" description="Per-employee summary. Download the full breakdown for component-level detail.">
          {items.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Gross Pay</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{item.worker_name ?? "-"}</p>
                    </TableCell>
                    <TableCell>{`${run.currency} ${item.gross_pay?.toLocaleString() ?? "-"}`}</TableCell>
                    <TableCell>{`${run.currency} ${item.total_deductions?.toLocaleString() ?? "-"}`}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{`${run.currency} ${item.net_pay?.toLocaleString() ?? "-"}`}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No items" description="No payroll items for this run." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
