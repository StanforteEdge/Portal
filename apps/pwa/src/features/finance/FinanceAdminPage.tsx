import { useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  formatCurrency,
} from "@stanforte/shared";
import { Link, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { formatDisplayDate, formatPersonName, formatRequestStatus, requestStatusTone } from "@/features/requests/request-helpers";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { listFinanceRequests } from "./finance-api";

export default function FinanceAdminPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useCachedQuery("finance-admin:profile", () => getWorkspaceProfile(), {
    ttlMs: 1000 * 60,
    storage: "memory",
  });
  const { data: financeRequests, loading, error } = useCachedQuery("finance-admin:requests", () => listFinanceRequests(), {
    ttlMs: 1000 * 30,
    storage: "memory",
  });

  const queue = financeRequests ?? [];
  const isRequestsView = location.pathname === "/finance/requests";
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "disbursed" | "confirmed" | "retired" | "completed">("all");
  const cleared = queue.filter((entry) => String(entry.status || "").toLowerCase() === "cleared").length;
  const disbursed = queue.filter((entry) => String(entry.status || "").toLowerCase() === "disbursed").length;
  const confirmed = queue.filter((entry) => String(entry.status || "").toLowerCase() === "confirmed").length;
  const completed = queue.filter((entry) => ["retired", "completed", "confirmed"].includes(String(entry.status || "").toLowerCase())).length;
  const awaitingRetirement = queue.filter((entry) => ["disbursed", "confirmed"].includes(String(entry.status || "").toLowerCase())).length;
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";
  const filteredQueue = queue.filter((entry) => statusFilter === "all" || String(entry.status || "").toLowerCase() === statusFilter);
  const queueRows = isRequestsView ? filteredQueue : filteredQueue.slice(0, 8);

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="Finance"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Finance", path: "/finance" },
          ...(isRequestsView ? [{ label: "Requests" }] : []),
        ]}
        title={isRequestsView ? "Finance Requests" : "Finance Admin"}
        description={
          isRequestsView
            ? "Manage the finance request queue from cleared approval through disbursement, confirmation, retirement, and completion."
            : "Monitor the live finance workflow and move cleared requests through payout and closure."
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Finance Queue" value={String(queue.length)} tone="neutral" />
          <StatCard label="Ready To Disburse" value={String(cleared)} tone="warning" />
          <StatCard label="Awaiting Retirement" value={String(awaitingRetirement)} tone="pending" />
          <StatCard label="Completed" value={String(completed)} tone="success" />
        </div>

        <SectionCard
          title={isRequestsView ? "Finance Request Queue" : "Priority Finance Queue"}
          description={
            isRequestsView
              ? "Use this queue to process requests through disbursement, receipt confirmation, retirement review, and completion."
              : "Start with the requests that are ready for finance action right now."
          }
          action={
            !isRequestsView ? (
              <Link to="/finance/requests" className="text-sm font-semibold text-brand-900 transition hover:underline">
                View full queue
              </Link>
            ) : undefined
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {[
              { key: "all", label: "All", count: queue.length },
              { key: "cleared", label: "Cleared", count: cleared },
              { key: "disbursed", label: "Disbursed", count: disbursed },
              { key: "confirmed", label: "Confirmed", count: confirmed },
              { key: "retired", label: "Retired", count: queue.filter((entry) => String(entry.status || "").toLowerCase() === "retired").length },
              { key: "completed", label: "Completed", count: queue.filter((entry) => String(entry.status || "").toLowerCase() === "completed").length },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key as typeof statusFilter)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                  statusFilter === item.key ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                <span>{item.label}</span>
                <span className={statusFilter === item.key ? "text-white/80" : "text-slate-500"}>{item.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading finance requests...</div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">{error}</div>
          ) : queueRows.length ? (
            <div className="overflow-hidden rounded-[22px] border border-slate-200">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queueRows.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 bg-white">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-950">{entry.request_number || entry.id}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.request_type?.name || "Request"}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatPersonName(entry.creator)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(entry.total_amount || 0, entry.currency || "NGN")}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatDisplayDate(entry.created_at)}</td>
                      <td className="px-4 py-4">
                        <Chip variant={requestStatusTone(entry.status)}>{formatRequestStatus(entry.status)}</Chip>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            to={`/requests/details?id=${entry.id}&view=finance`}
                            className="text-sm font-semibold text-brand-900 transition hover:underline"
                          >
                            Open
                          </Link>
                          {String(entry.status || "").toLowerCase() === "disbursed" ? (
                            <Link
                              to="/finance/payment-vouchers"
                              className="text-sm font-semibold text-slate-600 transition hover:underline"
                            >
                              Vouchers
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No finance requests yet"
              description="Once cleared requests reach finance, they’ll appear here for disbursement and voucher handling."
            />
          )}
        </SectionCard>

        {!isRequestsView ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Workflow Coverage"
              description="The shared request details page now follows the full finance lifecycle for finance viewers."
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                {[
                  "Cleared",
                  "Disbursed",
                  "Confirmed",
                  "Retired",
                  "Completed",
                ].map((step) => (
                  <div key={step} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Step
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{step}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <section className="section-card bg-brand-900 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                    Finance Tools
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    Payment voucher workspace
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    Review disbursements, monitor retirements, and confirm voucher closure from one place.
                  </p>
                </div>
                <Icon name="payments" className="text-[26px] text-white/70" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/finance/payment-vouchers" className="inline-flex">
                  <Button className="bg-white text-brand-900 hover:bg-slate-100">
                    Open Vouchers
                  </Button>
                </Link>
                <Link to="/finance/requests" className="inline-flex">
                  <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                    Review Queue
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
