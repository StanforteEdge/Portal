import { useMemo, useState } from "react";
import {
  AppShell,
  Button,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  SlideOver,
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
import { buildAppMobileNav, buildRequestsNavigation } from "@/pages/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency, formatDate } from "@stanforte/shared";

type EntryLine = {
  chart_account_id: string;
  description: string;
  debit: number;
  credit: number;
};

export default function StatutoryDeductionManualEntryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [deductionTypeId, setDeductionTypeId] = useState("");
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [withheldAmount, setWithheldAmount] = useState<number>(0);
  const [lines, setLines] = useState<EntryLine[]>([
    { chart_account_id: "", description: "", debit: 0, credit: 0 },
    { chart_account_id: "", description: "", debit: 0, credit: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editEntryDate, setEditEntryDate] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editCurrency, setEditCurrency] = useState("NGN");
  const [editLines, setEditLines] = useState<EntryLine[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const { data: chartAccountsData } = useCachedQuery(
    "finance:statutory-deduction-manual-entry:chart-accounts",
    () => financeApi.listChartAccounts({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const chartAccounts = Array.isArray((chartAccountsData as any)?.result)
    ? (chartAccountsData as any).result
    : [];

  const { data: deductionTypesData } = useCachedQuery(
    "finance:statutory-deduction-manual-entry:deduction-types",
    () => financeApi.listDeductionTypes({ page: 1, per_page: 200 }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const deductionTypes = Array.isArray((deductionTypesData as any)?.result)
    ? (deductionTypesData as any).result
    : Array.isArray(deductionTypesData)
      ? deductionTypesData
      : [];

  const { data: entriesPayload, loading } = useCachedQuery(
    `finance:statutory-deduction-manual-entry:list:${refreshKey}`,
    () => financeApi.listStatutoryDeductionManualEntries({ page: 1, per_page: 50 }),
    { ttlMs: 0, storage: "memory" },
  );
  const entries = Array.isArray(entriesPayload?.result) ? entriesPayload.result : [];

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

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditEntryDate((entry.entryDate || entry.entry_date || "").slice(0, 10));
    setEditMemo(entry.memo || "");
    setEditCurrency(entry.currency || "NGN");
    setEditLines(
      (entry.lines || []).map((l: any) => ({
        chart_account_id: l.chartAccountId || l.chart_account_id || "",
        description: l.description || "",
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }))
    );
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    if (!editEntryDate) {
      showToast({ tone: "warning", title: "Date required", message: "Set an entry date." });
      return;
    }
    const editTotals = editLines.reduce(
      (acc, l) => ({ debit: acc.debit + Number(l.debit || 0), credit: acc.credit + Number(l.credit || 0) }),
      { debit: 0, credit: 0 },
    );
    if (Math.abs(editTotals.debit - editTotals.credit) > 0.001) {
      showToast({ tone: "danger", title: "Not balanced", message: "Debits and credits must be equal." });
      return;
    }
    const normalized = editLines
      .map((l) => ({
        chart_account_id: l.chart_account_id,
        description: l.description || undefined,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }))
      .filter((l) => l.chart_account_id && (l.debit > 0 || l.credit > 0));
    if (normalized.length < 2) {
      showToast({ tone: "warning", title: "Incomplete", message: "At least two valid lines required." });
      return;
    }
    try {
      setEditSaving(true);
      await financeApi.updateStatutoryDeductionManualEntry(editingEntry.id, {
        entry_date: editEntryDate,
        memo: editMemo.trim() || undefined,
        currency: editCurrency.toUpperCase(),
        lines: normalized,
      });
      showToast({ tone: "success", title: "Updated", message: "Journal entry updated." });
      setEditingEntry(null);
      setRefreshKey((v) => v + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Update failed", message: err instanceof Error ? err.message : "Unable to update." });
    } finally {
      setEditSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!entryDate) {
      showToast({ tone: "warning", title: "Date required", message: "Set an entry date." });
      return;
    }
    if (!deductionTypeId) {
      showToast({ tone: "warning", title: "Deduction type required", message: "Select a statutory deduction type." });
      return;
    }
    if (Number(grossAmount) <= 0) {
      showToast({ tone: "warning", title: "Gross amount required", message: "Enter a positive gross amount." });
      return;
    }
    if (Number(withheldAmount) <= 0) {
      showToast({ tone: "warning", title: "Withheld amount required", message: "Enter a positive withheld amount." });
      return;
    }
    if (Number(withheldAmount) > Number(grossAmount)) {
      showToast({ tone: "warning", title: "Invalid amounts", message: "Withheld amount cannot exceed gross amount." });
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
      await financeApi.createStatutoryDeductionManualEntry({
        entry_date: entryDate,
        memo: memo.trim() || undefined,
        currency: currency.toUpperCase(),
        deduction_type_id: deductionTypeId,
        gross_amount: grossAmount,
        withheld_amount: withheldAmount,
        lines: normalized,
      });
      showToast({ tone: "success", title: "Posted", message: "Statutory deduction journal entry posted." });
      setMemo("");
      setGrossAmount(0);
      setWithheldAmount(0);
      setLines([
        { chart_account_id: "", description: "", debit: 0, credit: 0 },
        { chart_account_id: "", description: "", debit: 0, credit: 0 },
      ]);
      setRefreshKey((v) => v + 1);
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Post failed",
        message: err instanceof Error ? err.message : "Unable to post statutory deduction journal entry.",
      });
    } finally {
      setSaving(false);
    }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-statutory-deduction-entry"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Manual Entries" }, { label: "Statutory Deduction Entry" }]}
        title="Statutory Deduction Entry"
        description="Post balanced statutory deduction journal entries for withholdings and related adjustments."
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
            <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Statutory withholding memo" />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Statutory Details">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm md:col-span-2">
            <span className="font-semibold text-slate-700">Deduction Type</span>
            <select className="rounded-2xl border border-slate-200 px-4 py-2.5" value={deductionTypeId} onChange={(e) => setDeductionTypeId(e.target.value)}>
              <option value="">Select deduction type</option>
              {deductionTypes.map((type: any) => (
                <option key={type.id} value={type.id}>{type.name}{type.code ? ` (${type.code})` : ""}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-slate-700">Gross Amount</span>
            <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={grossAmount} onChange={(e) => setGrossAmount(Number(e.target.value))} />
          </label>
          <label className="grid gap-1.5 text-sm md:col-span-3">
            <span className="font-semibold text-slate-700">Withheld Amount</span>
            <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={withheldAmount} onChange={(e) => setWithheldAmount(Number(e.target.value))} />
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

      <SectionCard title="Recent Statutory Deduction Entries">
        {loading ? <p className="text-sm text-slate-500">Loading entries...</p> : null}
        {entries.length ? (
          <Table caption="Statutory deduction manual journal entries">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Entry No</TableHeaderCell>
                <TableHeaderCell>Memo</TableHeaderCell>
                <TableHeaderCell className="text-right">Debit</TableHeaderCell>
                <TableHeaderCell className="text-right">Credit</TableHeaderCell>
                <TableHeaderCell>{" "}</TableHeaderCell>
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
                  <TableCell>
                    <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => openEdit(entry)}>Edit</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No statutory deduction entries" description="Posted statutory deduction journal entries will appear here." />
        ) : null}
      </SectionCard>

      {editingEntry && (
        <SlideOver open onClose={() => setEditingEntry(null)} size="md">
          <div className="space-y-4 p-4">
            <h3 className="font-semibold text-slate-800">Edit Journal Entry</h3>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Entry Date</span>
              <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editEntryDate} onChange={(e) => setEditEntryDate(e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Currency</span>
              <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editCurrency} onChange={(e) => setEditCurrency(e.target.value.toUpperCase())} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Memo</span>
              <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editMemo} onChange={(e) => setEditMemo(e.target.value)} />
            </label>
            <div className="space-y-2">
              <span className="font-semibold text-slate-700 text-sm">Lines</span>
              {editLines.map((line, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-12 items-end">
                  <select className="md:col-span-4 rounded-2xl border border-slate-200 px-3 py-2 text-sm" value={line.chart_account_id} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, chart_account_id: e.target.value } : l))}>
                    <option value="">Account</option>
                    {chartAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                  <input className="md:col-span-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Description" value={line.description} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))} />
                  <input type="number" className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Debit" value={line.debit} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, debit: Number(e.target.value) } : l))} />
                  <input type="number" className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Credit" value={line.credit} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, credit: Number(e.target.value) } : l))} />
                  <button className="md:col-span-1 text-red-500 text-sm" onClick={() => setEditLines((p) => p.filter((_, i) => i !== idx))} disabled={editLines.length <= 2}>×</button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setEditLines((p) => [...p, { chart_account_id: "", description: "", debit: 0, credit: 0 }])}>+ Line</Button>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="secondary" onClick={() => setEditingEntry(null)}>Cancel</Button>
              <Button onClick={() => void handleUpdate()} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </SlideOver>
      )}
    </AppShell>
  );
}
