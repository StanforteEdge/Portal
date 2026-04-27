import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  Button,
  Chip,
  EmptyState,
  PageHeader,
  PaginationControls,
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
  useToast,
} from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { downloadBase64File } from "@/shared/lib/download";
import { formatCurrency } from "@stanforte/shared";
import type { FinanceLedgerEntry } from "@stanforte/shared";

function dateText(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString();
}

function money(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

export default function FinanceLedgerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [from, to, accountId, search, perPage]);

  const query = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      account_id: accountId !== "all" ? accountId : undefined,
      q: search.trim() || undefined,
      page,
      per_page: perPage,
    }),
    [from, to, accountId, search, page, perPage],
  );

  const { data: ledgerPayload, loading, error } = useCachedQuery(
    `finance:ledger:${JSON.stringify(query)}`,
    () => financeApi.listLedgerPaged(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(ledgerPayload?.data) ? ledgerPayload.data : [];
  const meta = (ledgerPayload?.meta as any) || {
    page,
    per_page: perPage,
    total: rows.length,
    last_page: 1,
  };

  const { data: accountsData } = useCachedQuery(
    "finance:ledger:accounts",
    () => financeApi.listAccounts({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const accounts = Array.isArray(accountsData) ? accountsData : [];

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const direction = String(row.direction || "").toLowerCase();
        const amount = Number(row.amount || 0);
        if (direction === "in") acc.inflow += amount;
        else if (direction === "out") acc.outflow += amount;
        acc.net += direction === "out" ? -amount : amount;
        return acc;
      },
      { inflow: 0, outflow: 0, net: 0 },
    );
  }, [rows]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  async function handleExportLedger() {
    try {
      setExporting(true);
      const file = await financeApi.exportLedger({
        from: from || undefined,
        to: to || undefined,
        account_id: accountId !== "all" ? accountId : undefined,
        q: search.trim() || undefined,
      });
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
      showToast({ tone: "success", title: "Ledger exported", message: "Your ledger CSV has been downloaded." });
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Export failed",
        message: err instanceof Error ? err.message : "Unable to export ledger right now.",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-ledger"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Ledger" }]}
        title="General Ledger"
        description="Review transaction movements and account activity with audit-ready clarity."
        actions={
          <Button variant="secondary" disabled={exporting} onClick={() => void handleExportLedger()}>
            {exporting ? "Exporting..." : "Export Ledger"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Inflow" value={money(totals.inflow)} tone="success" />
        <StatCard label="Outflow" value={money(totals.outflow)} tone="warning" />
        <StatCard label="Net Movement" value={money(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} />
      </div>

      <SectionCard title="Filters" description="Narrow entries by date, account, and reference.">
        <div className="grid gap-4 md:grid-cols-4">
          <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <SelectField label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="all">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code ? `${account.code} - ${account.name}` : account.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Search" placeholder="Ref, memo, source" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Ledger Entries" description="Chronological transaction view for finance operations.">
        {loading ? <p className="text-sm text-slate-500">Loading ledger...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {rows.length ? (
          <>
            <Table caption="Finance ledger">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Reference</TableHeaderCell>
                  <TableHeaderCell>Account</TableHeaderCell>
                  <TableHeaderCell>Source</TableHeaderCell>
                  <TableHeaderCell>Direction</TableHeaderCell>
                  <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {rows.map((row: FinanceLedgerEntry) => {
                  const direction = String(row.direction || "-").toLowerCase();
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{dateText(row.entry_date || row.date)}</TableCell>
                      <TableCell>{String(row.reference || row.id).slice(0, 36)}</TableCell>
                      <TableCell>{String(row.account_name || "-")}</TableCell>
                      <TableCell>{String(row.source_type || "-")}</TableCell>
                      <TableCell>
                        <Chip variant={direction === "in" ? "success" : direction === "out" ? "warning" : "neutral"}>
                          {direction || "-"}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">{money(row.amount, String(row.currency || "NGN"))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationControls
              page={Number(meta.page || page)}
              totalPages={Number(meta.last_page || 1)}
              totalCount={Number(meta.total || 0)}
              itemLabel="entry"
              perPage={Number(meta.per_page || perPage)}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
              onPageChange={setPage}
            />
          </>
        ) : !loading ? (
          <EmptyState title="No ledger entries" description="Transactions will appear here once finance entries are posted." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
