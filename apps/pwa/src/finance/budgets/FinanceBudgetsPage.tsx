import { useMemo, useState } from "react";
import {
  AppShell,
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
  TextField,
} from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import type { FinanceBudgetRecord } from "@stanforte/shared";

function asMoney(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

export default function FinanceBudgetsPage() {
  const { user } = useAuth();
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      year: year ? Number(year) : undefined,
      status: status !== "all" ? status : undefined,
      q: search.trim() || undefined,
    }),
    [year, status, search],
  );

  const { data: rowsData, loading, error } = useCachedQuery(
    `finance:budgets:${JSON.stringify(query)}`,
    () => financeApi.listBudgets(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(rowsData) ? rowsData : [];

  const stats = useMemo(() => {
    const totalBudget = rows.reduce((sum, row) => sum + Number(row.total_budget || 0), 0);
    const totalActual = rows.reduce((sum, row) => sum + Number(row.total_actual || 0), 0);
    const totalVariance = rows.reduce((sum, row) => sum + Number(row.variance_amount || 0), 0);
    return { totalBudget, totalActual, totalVariance };
  }, [rows]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-budgets"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Budgets" }]}
        title="Budgets"
        description="Track approved budgets, actual spend, and variance in one view."
        actions={<Button>New Budget</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Budget" value={asMoney(stats.totalBudget)} tone="neutral" />
        <StatCard label="Actual Spend" value={asMoney(stats.totalActual)} tone="warning" />
        <StatCard
          label="Variance"
          value={asMoney(stats.totalVariance)}
          tone={stats.totalVariance >= 0 ? "success" : "danger"}
        />
      </div>

      <SectionCard title="Filters">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </SelectField>
          <TextField label="Search" placeholder="Title or note" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Budget Register" description="Zoho-style budget overview with drill-down readiness.">
        {loading ? <p className="text-sm text-slate-500">Loading budgets...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {rows.length ? (
          <Table caption="Budget list">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Period</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Budget</TableHeaderCell>
                <TableHeaderCell className="text-right">Actual</TableHeaderCell>
                <TableHeaderCell className="text-right">Variance</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {rows.map((row: FinanceBudgetRecord) => {
                const label = row.title || [row.month ? `M${row.month}` : null, row.quarter ? `Q${row.quarter}` : null, row.year || ""].filter(Boolean).join(" ");
                const statusKey = String(row.status || "draft").toLowerCase();
                const variance = Number(row.variance_amount || 0);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{label || row.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip variant={statusKey === "approved" ? "success" : statusKey === "draft" ? "pending" : "neutral"}>
                        {statusKey}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-right">{asMoney(row.total_budget, String(row.currency || "NGN"))}</TableCell>
                    <TableCell className="text-right">{asMoney(row.total_actual, String(row.currency || "NGN"))}</TableCell>
                    <TableCell className="text-right">
                      <span className={variance >= 0 ? "text-success" : "text-danger"}>{asMoney(variance, String(row.currency || "NGN"))}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No budgets yet" description="Create a budget to start variance tracking." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
