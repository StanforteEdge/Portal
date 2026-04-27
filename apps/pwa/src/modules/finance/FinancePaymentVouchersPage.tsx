import { useState } from "react";
import {
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  StatCard,
} from "@/shared";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";
import { Link } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import PVDeductionsPanel from "./PVDeductionsPanel";
import {
  buildAppMobileNav,
  buildRequestsNavigation,
} from "@/features/requests/requests-data";
import {
  formatRequestStatus,
  requestStatusTone,
} from "@/features/requests/request-helpers";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { financeApi, useCachedQuery } from "@/shared/lib/core";

function retirementLabel(value: string) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "verified") return "Confirmed";
  if (key === "retired") return "Retired";
  if (key === "partial") return "Partial";
  return "Pending";
}

function retirementTone(
  value: string,
): "success" | "warning" | "pending" | "danger" | "neutral" {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "verified") return "success";
  if (key === "retired") return "warning";
  if (key === "partial") return "pending";
  return "neutral";
}

export default function FinancePaymentVouchersPage() {
  const { user } = useAuth();
  const [deductionsPV, setDeductionsPV] = useState<Record<string, any> | null>(null);
  const { data: profile } = useCachedQuery(
    "finance-vouchers:profile",
    () => getWorkspaceProfile(),
    {
      ttlMs: 1000 * 60,
      storage: "memory",
    },
  );
  const {
    data: vouchers,
    loading,
    error,
  } = useCachedQuery(
    "finance-vouchers:list",
    () => financeApi.listPaymentVouchers(),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );

  const rows = vouchers ?? [];
  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  );
  const retiredAmount = rows.reduce(
    (sum, row) => sum + Number(row.retired_amount || 0),
    0,
  );
  const pendingRetirement = rows.filter(
    (row) =>
      !["verified", "retired"].includes(
        String(row.retirement_status || "").toLowerCase(),
      ),
  ).length;
  const confirmed = rows.filter(
    (row) => String(row.retirement_status || "").toLowerCase() === "verified",
  ).length;
  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Staff";

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-vouchers"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Staff",
      }}
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
          <StatCard
            label="Total Vouchers"
            value={String(rows.length)}
            tone="neutral"
          />
          <StatCard
            label="Disbursed Amount"
            value={formatCurrency(totalAmount, "NGN")}
            tone="warning"
          />
          <StatCard
            label="Retired Amount"
            value={formatCurrency(retiredAmount, "NGN")}
            tone="pending"
          />
          <StatCard
            label="Confirmed"
            value={String(confirmed)}
            tone="success"
          />
        </div>

        <SectionCard
          title="Voucher Register"
          description="Use this register to follow each voucher from disbursement through retirement verification."
          action={
            <Chip variant="warning">
              {pendingRetirement} pending retirement
            </Chip>
          }
        >
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading payment vouchers...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {error}
            </div>
          ) : rows.length ? (
            <div className="rounded-[22px] border border-slate-200 bg-white">
              <Table caption="Payment vouchers">
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Voucher</TableHeaderCell>
                    <TableHeaderCell>Request</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                    <TableHeaderCell>Disbursed</TableHeaderCell>
                    <TableHeaderCell>Retirement</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Action
                    </TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-950">
                          {row.voucher_number}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.method || "Disbursement"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-950">
                          {row.request_number}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.request_creator_name}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatCurrency(row.amount, "NGN")}
                        <p className="mt-1 text-xs text-slate-500">
                          Retired: {formatCurrency(row.retired_amount, "NGN")}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatDisplayDate(row.disbursed_at)}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatRequestStatus(row.request_status)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip variant={retirementTone(row.retirement_status)}>
                          {retirementLabel(row.retirement_status)}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setDeductionsPV(row)}
                            className="text-sm font-semibold text-slate-500 transition hover:text-slate-900 hover:underline"
                          >
                            Deductions
                          </button>
                          <Link
                            to={`/finance/requests/details?id=${row.request_id}`}
                            className="text-sm font-semibold text-brand-900 transition hover:underline"
                          >
                            Open request
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No payment vouchers yet"
              description="Disbursed finance requests will create payment vouchers that appear here."
            />
          )}
        </SectionCard>
      </div>

      {deductionsPV && (
        <PVDeductionsPanel
          pv={deductionsPV}
          onClose={() => setDeductionsPV(null)}
          onSaved={() => setDeductionsPV(null)}
        />
      )}
    </AppShell>
  );
}
