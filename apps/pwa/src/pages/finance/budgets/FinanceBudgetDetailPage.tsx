import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppShell,
  Button,
  Chip,
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
import { buildAppMobileNav, buildRequestsNavigation } from "@/pages/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
// For toast notifications, you can use window.alert temporarily or actual toast if available
// Assuming `@/shared` exports some toast, or we just handle visually. For now we use standard error handling.

function asMoney(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

export default function FinanceBudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  const [activeTab, setActiveTab] = useState<"summary" | "expenditures" | "assumptions" | "portfolio">("summary");
  const [isApproving, setIsApproving] = useState(false);

  const { data: budget, loading, error, refetch } = useCachedQuery(
    `finance:budget:${id}`,
    () => financeApi.getBudget(id!),
    { ttlMs: 30_000, storage: "memory" }
  );

  const handleApprove = async () => {
    if (!id || !confirm("Are you sure you want to approve this budget?")) return;
    setIsApproving(true);
    try {
      if (financeApi.approveBudget) {
        await financeApi.approveBudget(id);
      }
      alert("Budget approved successfully");
      refetch();
    } catch (e: any) {
      alert(e?.message || "Failed to approve budget");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!id) return;
    try {
      if (financeApi.recalculateBudget) {
        await financeApi.recalculateBudget(id);
      }
      alert("Budget recalculated");
      refetch();
    } catch (e: any) {
      alert(e?.message || "Failed to recalculate budget");
    }
  };

  if (loading) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-budgets"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <div className="flex h-64 items-center justify-center text-slate-500">Loading budget details...</div>
      </AppShell>
    );
  }

  if (error || !budget) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-budgets"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <div className="flex h-64 items-center justify-center text-danger">Failed to load budget details.</div>
      </AppShell>
    );
  }

  const title = budget.title || `Budget M${budget.month || ""} Q${budget.quarter || ""} ${budget.year || ""}`.trim();
  const isDraft = String(budget.status).toLowerCase() === "draft";
  const lines = (budget as any).lines || [];
  const assumptions = (budget as any).assumptions || [];
  const portfolio = (budget as any).portfolio || [];

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-budgets"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Budget Details"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Budgets", path: "/finance/budgets" },
          { label: title || "Detail" }
        ]}
        title={title}
        description={`Status: ${budget.status || "Draft"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRecalculate}>Recalculate</Button>
            {isDraft && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/finance/budgets/${id}/edit`)}>Edit</Button>
                <Button onClick={handleApprove} disabled={isApproving}>{isApproving ? "Approving..." : "Approve"}</Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Budget" value={asMoney(budget.total_budget, budget.currency)} tone="neutral" />
        <StatCard label="Actual Spend" value={asMoney(budget.total_actual, budget.currency)} tone="warning" />
        <StatCard
          label="Variance"
          value={asMoney(budget.variance_amount, budget.currency)}
          tone={(budget.variance_amount || 0) >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mb-6 flex border-b border-slate-200">
        {(["summary", "expenditures", "assumptions", "portfolio"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <SectionCard title="Budget Summary">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Year</p>
              <p className="mt-1 font-semibold">{budget.year}</p>
            </div>
            {budget.quarter && (
              <div>
                <p className="text-sm font-medium text-slate-500">Quarter</p>
                <p className="mt-1 font-semibold">Q{budget.quarter}</p>
              </div>
            )}
            {budget.month && (
              <div>
                <p className="text-sm font-medium text-slate-500">Month</p>
                <p className="mt-1 font-semibold">M{budget.month}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-500">Currency</p>
              <p className="mt-1 font-semibold">{budget.currency || "NGN"}</p>
            </div>
          </div>
          {(budget as any).notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">Notes</p>
              <p className="mt-1 text-slate-700 whitespace-pre-wrap">{(budget as any).notes}</p>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "expenditures" && (
        <SectionCard title="Expenditures" description="Budgeted line items for the period.">
          {lines.length > 0 ? (
            <Table caption="Budget Lines">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Group</TableHeaderCell>
                  <TableHeaderCell>Line Name</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total Amount</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {lines.map((line: any, idx: number) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{line.group_name || "-"}</TableCell>
                    <TableCell>{line.line_name}</TableCell>
                    <TableCell className="text-right">{asMoney(line.total_amount, budget.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No expenditure lines recorded.</p>
          )}
        </SectionCard>
      )}

      {activeTab === "assumptions" && (
        <SectionCard title="Assumptions" description="Key assumptions underlying this budget.">
          {assumptions.length > 0 ? (
            <Table caption="Budget Assumptions">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Label</TableHeaderCell>
                  <TableHeaderCell>Value</TableHeaderCell>
                  <TableHeaderCell>Notes</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {assumptions.map((asm: any, idx: number) => (
                  <TableRow key={asm.id || idx}>
                    <TableCell>{asm.label}</TableCell>
                    <TableCell>{asm.value}</TableCell>
                    <TableCell>{asm.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No assumptions recorded.</p>
          )}
        </SectionCard>
      )}

      {activeTab === "portfolio" && (
        <SectionCard title="Portfolio Integrations" description="Grants and funds mapped to this budget.">
          {portfolio.length > 0 ? (
            <Table caption="Budget Portfolio">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Funder Name</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total Budget</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {portfolio.map((port: any, idx: number) => (
                  <TableRow key={port.id || idx}>
                    <TableCell>{port.funder_name}</TableCell>
                    <TableCell>
                      <Chip variant="neutral">{port.status}</Chip>
                    </TableCell>
                    <TableCell className="text-right">{asMoney(port.total_budget, budget.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No portfolio integrations recorded.</p>
          )}
        </SectionCard>
      )}
    </AppShell>
  );
}
