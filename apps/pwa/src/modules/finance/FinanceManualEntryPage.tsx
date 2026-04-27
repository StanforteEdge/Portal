import { useMemo, useState } from "react";
import {
  AppShell,
  Button,
  EmptyState,
  Icon,
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
  useToast,
} from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import { formatDate } from "@/shared/lib/formatting";

type EntryLine = {
  chart_account_id: string;
  description: string;
  debit: number;
  credit: number;
};

export default function FinanceManualEntryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [lines, setLines] = useState<EntryLine[]>([
    { chart_account_id: "", description: "", debit: 0, credit: 0 },
    { chart_account_id: "", description: "", debit: 0, credit: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const { data: chartAccountsData } = useCachedQuery(
    "finance:manual-entry:chart-accounts",
    () => financeApi.listChartAccounts({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const chartAccounts = Array.isArray(chartAccountsData) ? chartAccountsData : [];

  const { data: entriesPayload, loading } = useCachedQuery(
    `finance:manual-entry:list:${refreshKey}`,
    () => financeApi.listManualEntries({ page: 1, per_page: 50 }),
    { ttlMs: 0, storage: "memory" },
  );
  const entries = Array.isArray((entriesPayload as any)?.result) ? (entriesPayload as any).result : [];

  const totals = useMemo(
    () =>
      lines.reduce(
        (acc, line) => {
          acc.debit += Number(line.debit || 0);
          acc.credit += Number(line.credit || 0);
          return acc;
        },
        { debit: 0, credit: 0 },
      ),
    [lines],
  );
  const balanced = Math.abs(totals.debit - totals.credit) < 0.001;

  const setLine = (index: number, patch: Partial<EntryLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setLines((prev) => [...prev, { chart_account_id: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!entryDate) {
      showToast({ tone: "warning", title: "Date required", message: "Set an entry date." });
      return;
    }
    if (!balanced) {
      showToast({ tone: "danger", title: "Entry not balanced", message: "Debits and credits must be equal." });
      return;
    }

    const normalized = lines
      .map((line) => ({
        chart_account_id: line.chart_account_id,
        description: line.description || undefined,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
      }))
      .filter((line) => line.chart_account_id && (line.debit > 0 || line.credit > 0));

    if (normalized.length < 2) {
      showToast({ tone: "warning", title: "Incomplete lines", message: "Add at least two valid lines." });
      return;
    }

    try {
      setSaving(true);
      await financeApi.createManualEntry({
        entry_date: entryDate,
        memo: memo.trim() || undefined,
        currency: currency.toUpperCase(),
        lines: normalized,
      });
      showToast({ tone: "success", title: "Posted", message: "Manual journal entry posted." });
      setMemo("");
      setLines([
        { chart_account_id: "", description: "", debit: 0, credit: 0 },
        { chart_account_id: "", description: "", debit: 0, credit: 0 },
      ]);
      setRefreshKey((v) => v + 1);
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Post failed",
        message: err instanceof Error ? err.message : "Unable to post manual journal entry.",
      });
    } finally {
      setSaving(false);
    }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-manual-entry"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Manual Entry" }]}
        title="Manual Journal Entry"
        description="Post balanced journal entries for adjustments and corrections."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Debit" value={formatCurrency(totals.debit, currency)} tone="neutral" />
        <StatCard label="Total Credit" value={formatCurrency(totals.credit, currency)} tone="neutral" />
        <StatCard label="Status" value={balanced ? "Balanced" : "Unbalanced"} tone={balanced ? "success" : "danger"} />
      </div>

      <SectionCard title="Entry Header">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-slate-700">Entry Date</span>
            <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-slate-700">Currency</span>
            <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </label>
          <label className="grid gap-1.5 text-sm md:col-span-3">
            <span className="font-semibold text-slate-700">Memo</span>
            <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Adjustment reason" />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Journal Lines"
        description="Each entry must be balanced before posting."
        action={<Button variant="secondary" onClick={addLine}><Icon name="add" className="text-[16px]" />Add Line</Button>}
      >
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-12 items-end">
              <label className="grid gap-1.5 text-sm md:col-span-4">
                <span className="font-semibold text-slate-700">Chart Account</span>
                <select className="rounded-2xl border border-slate-200 px-4 py-2.5" value={line.chart_account_id} onChange={(e) => setLine(index, { chart_account_id: e.target.value })}>
                  <option value="">Select account</option>
                  {chartAccounts.map((account: any) => (
                    <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-3">
                <span className="font-semibold text-slate-700">Description</span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={line.description} onChange={(e) => setLine(index, { description: e.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Debit</span>
                <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={line.debit} onChange={(e) => setLine(index, { debit: Number(e.target.value) })} />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Credit</span>
                <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={line.credit} onChange={(e) => setLine(index, { credit: Number(e.target.value) })} />
              </label>
              <div className="md:col-span-1">
                <Button variant="danger" size="sm" onClick={() => removeLine(index)} disabled={lines.length <= 2}><Icon name="delete" className="text-sm" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void handleSubmit()} disabled={saving || !balanced}>{saving ? "Posting..." : "Post Entry"}</Button>
        </div>
      </SectionCard>

      <SectionCard title="Recent Manual Entries">
        {loading ? <p className="text-sm text-slate-500">Loading entries...</p> : null}
        {entries.length ? (
          <Table caption="Manual journal entries">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Entry No</TableHeaderCell>
                <TableHeaderCell>Memo</TableHeaderCell>
                <TableHeaderCell className="text-right">Debit</TableHeaderCell>
                <TableHeaderCell className="text-right">Credit</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.entryDate || entry.entry_date)}</TableCell>
                  <TableCell>{entry.entryNo || entry.entry_no || entry.id.slice(0, 8)}</TableCell>
                  <TableCell>{entry.memo || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(entry.totalDebit ?? entry.total_debit ?? 0), entry.currency || "NGN")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(entry.totalCredit ?? entry.total_credit ?? 0), entry.currency || "NGN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No manual entries" description="Posted manual journal entries will appear here." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
