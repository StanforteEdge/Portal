import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import type { FinanceBillRecord } from "@stanforte/shared";

function asMoney(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

function asDate(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString();
}

export default function FinancePayablesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const billId = searchParams.get("id");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      status: status !== "all" ? status : undefined,
      q: search.trim() || undefined,
    }),
    [status, search],
  );

  const { data: rowsData, loading, error } = useCachedQuery(
    `finance:payables:${JSON.stringify(query)}`,
    () => financeApi.listBills(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(rowsData) ? rowsData : [];

  const { data: billData } = useCachedQuery(
    `finance:bill:${billId}`,
    () => financeApi.getBill(billId!),
    { ttlMs: 60_000, storage: "memory" },
  );
  const bill = billData as FinanceBillRecord | undefined;

  const stats = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.billed += Number(row.total_amount || 0);
        acc.paid += Number(row.paid_amount || 0);
        acc.outstanding += Number(row.outstanding_amount || 0);
        return acc;
      },
      { billed: 0, paid: 0, outstanding: 0 },
    );
  }, [rows]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  if (billId && bill) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-payables"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <PageHeader
          eyebrow="Finance"
          breadcrumbs={[
            { label: "Finance", path: "/finance" },
            { label: "Payables", path: "/finance/payables" },
            { label: bill.bill_number || billId.slice(0, 8) },
          ]}
          title="Bill Details"
          actions={
            <Button variant="secondary" onClick={() => setSearchParams({})}>
              Back to List
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Amount" value={asMoney(bill.total_amount)} tone="neutral" />
          <StatCard label="Paid" value={asMoney(bill.paid_amount)} tone="success" />
          <StatCard label="Outstanding" value={asMoney(bill.outstanding_amount)} tone="warning" />
          <StatCard
            label="Status"
            value={String(bill.status || "draft")}
            tone={bill.status === "paid" ? "success" : bill.status === "overdue" ? "danger" : "pending"}
          />
        </div>

        <SectionCard title="Bill Information">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Bill Number</TableCell>
                <TableCell className="font-semibold">{bill.bill_number || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Vendor</TableCell>
                <TableCell className="font-semibold">{bill.vendor_name || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Bill Date</TableCell>
                <TableCell>{asDate(bill.bill_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Due Date</TableCell>
                <TableCell>{asDate(bill.due_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Currency</TableCell>
                <TableCell>{bill.currency || "NGN"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Status</TableCell>
                <TableCell>
                  <Chip
                    variant={
                      bill.status === "paid"
                        ? "success"
                        : bill.status === "overdue"
                          ? "danger"
                          : bill.status === "approved"
                            ? "pending"
                            : "neutral"
                    }
                  >
                    {bill.status || "draft"}
                  </Chip>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-payables"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Payables" }]}
        title="Payables"
        description="Manage vendor bills, due dates, and outgoing obligations."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Billed" value={asMoney(stats.billed)} tone="neutral" />
        <StatCard label="Paid" value={asMoney(stats.paid)} tone="success" />
        <StatCard label="Outstanding" value={asMoney(stats.outstanding)} tone="warning" />
      </div>

      <SectionCard title="Filters">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </SelectField>
          <TextField label="Search" placeholder="Bill number or vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Vendor Bills" description="Payment planning view for cashflow control.">
        {loading ? <p className="text-sm text-slate-500">Loading bills...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {rows.length ? (
          <Table caption="Payables list">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Bill</TableHeaderCell>
                <TableHeaderCell>Vendor</TableHeaderCell>
                <TableHeaderCell>Bill Date</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Outstanding</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {rows.map((row: FinanceBillRecord) => {
                const statusKey = String(row.status || "draft").toLowerCase();
                return (
                  <TableRow key={row.id} onClick={() => setSearchParams({ id: row.id })}>
                    <TableCell>{row.bill_number || row.id.slice(0, 8)}</TableCell>
                    <TableCell>{row.vendor_name || "-"}</TableCell>
                    <TableCell>{asDate(row.bill_date)}</TableCell>
                    <TableCell>{asDate(row.due_date)}</TableCell>
                    <TableCell>
                      <Chip variant={statusKey === "paid" ? "success" : statusKey === "overdue" ? "danger" : "pending"}>
                        {statusKey}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-right">{asMoney(row.outstanding_amount, String(row.currency || "NGN"))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No payables" description="Vendor bills will appear here once created." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
