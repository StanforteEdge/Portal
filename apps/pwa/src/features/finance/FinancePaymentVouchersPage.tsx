import {
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  formatCurrency,
} from "@stanforte/shared";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { formatDisplayDate, formatRequestStatus, requestStatusTone } from "@/features/requests/request-helpers";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { listFinancePaymentVouchers } from "./finance-api";

function retirementLabel(value: string) {
  const key = String(value || "").trim().toLowerCase();
  if (key === "verified") return "Confirmed";
  if (key === "retired") return "Retired";
  if (key === "partial") return "Partial";
  return "Pending";
}

function retirementTone(value: string): "success" | "warning" | "pending" | "danger" | "neutral" {
  const key = String(value || "").trim().toLowerCase();
  if (key === "verified") return "success";
  if (key === "retired") return "warning";
  if (key === "partial") return "pending";
  return "neutral";
}

export default function FinancePaymentVouchersPage() {
  const { user } = useAuth();
  const { data: profile } = useCachedQuery("finance-vouchers:profile", () => getWorkspaceProfile(), {
    ttlMs: 1000 * 60,
    storage: "memory",
  });
  const { data: vouchers, loading, error } = useCachedQuery(
    "finance-vouchers:list",
    () => listFinancePaymentVouchers(),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );

  const rows = vouchers ?? [];
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const retiredAmount = rows.reduce((sum, row) => sum + Number(row.retired_amount || 0), 0);
  const pendingRetirement = rows.filter((row) => !["verified", "retired"].includes(String(row.retirement_status || "").toLowerCase())).length;
  const confirmed = rows.filter((row) => String(row.retirement_status || "").toLowerCase() === "verified").length;
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="Finance"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Finance", path: "/finance" },
          { label: "Payment Vouchers" },
        ]}
        title="Payment Vouchers"
        description="Track disbursements, retirements, and verified vouchers across finance requests."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Vouchers" value={String(rows.length)} tone="neutral" />
          <StatCard label="Disbursed Amount" value={formatCurrency(totalAmount, "NGN")} tone="warning" />
          <StatCard label="Retired Amount" value={formatCurrency(retiredAmount, "NGN")} tone="pending" />
          <StatCard label="Confirmed" value={String(confirmed)} tone="success" />
        </div>

        <SectionCard
          title="Voucher Register"
          description="Use this register to follow each voucher from disbursement through retirement verification."
          action={<Chip variant="warning">{pendingRetirement} pending retirement</Chip>}
        >
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading payment vouchers...</div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">{error}</div>
          ) : rows.length ? (
            <div className="overflow-hidden rounded-[22px] border border-slate-200">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-4 py-3">Voucher</th>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Disbursed</th>
                    <th className="px-4 py-3">Retirement</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 bg-white">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-950">{row.voucher_number}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.method || "Disbursement"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-950">{row.request_number}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.request_creator_name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.amount, "NGN")}
                        <p className="mt-1 text-xs text-slate-500">
                          Retired: {formatCurrency(row.retired_amount, "NGN")}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDisplayDate(row.disbursed_at)}
                        <p className="mt-1 text-xs text-slate-500">{formatRequestStatus(row.request_status)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Chip variant={retirementTone(row.retirement_status)}>{retirementLabel(row.retirement_status)}</Chip>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/requests/details?id=${row.request_id}&view=finance`}
                          className="text-sm font-semibold text-brand-900 transition hover:underline"
                        >
                          Open request
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No payment vouchers yet"
              description="Disbursed finance requests will create payment vouchers that appear here."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
