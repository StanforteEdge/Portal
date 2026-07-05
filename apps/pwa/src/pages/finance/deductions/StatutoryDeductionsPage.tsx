import { useState, useEffect, useCallback } from "react";
import {
  Button, Icon, PageHeader,
  Table, TableHead, TableHeaderRow, TableHeaderCell,
  TableRow, TableCell, TableBody,
  TextField, SelectField, useToast, SlideOver,
  SectionCard, Chip,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, resourceApi } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import type { FinanceRequestDeductionRecord } from "@/shared";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";

type Account = { id: string; name: string; bank_name: string | null };

export default function StatutoryDeductionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Finance";

  const [deductions, setDeductions] = useState<FinanceRequestDeductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [remitOpen, setRemitOpen] = useState(false);
  const [remitRef, setRemitRef] = useState("");
  const [remitDate, setRemitDate] = useState("");
  const [remitAccountId, setRemitAccountId] = useState("");
  const [remitFile, setRemitFile] = useState<File | null>(null);
  const [remitFileUploading, setRemitFileUploading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [remitting, setRemitting] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; total: number; total_pages: number } | null>(null);
  const [page, setPage] = useState(1);

  const fetchDeductions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, per_page: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await financeApi.listRequestDeductions(params);
      setDeductions(res.items);
      setPagination(res.pagination);
      setPage(p);
    } catch {
      showToast({ tone: "danger", title: "Load failed", message: "Failed to load deductions." });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, showToast]);

  useEffect(() => { void fetchDeductions(1); }, [fetchDeductions]);

  useEffect(() => {
    financeApi.listAccounts().then((res: any) => {
      setAccounts((res?.items ?? res?.data ?? []) as Account[]);
    }).catch(() => {});
  }, []);

  const handleRemit = async () => {
    if (!remitRef.trim()) return;

    let evidenceFileId: string | undefined;
    if (remitFile) {
      setRemitFileUploading(true);
      try {
        const uploaded = await resourceApi.uploadFile(remitFile);
        evidenceFileId = (uploaded as any)?.id;
      } catch {
        showToast({ tone: "danger", title: "Upload failed", message: "Could not upload evidence file." });
        setRemitFileUploading(false);
        return;
      }
      setRemitFileUploading(false);
    }

    setRemitting(true);
    try {
      const body: Record<string, unknown> = {
        deduction_ids: Array.from(selectedIds),
        reference: remitRef.trim(),
      };
      if (remitDate) body.remitted_at = new Date(remitDate).toISOString();
      if (remitAccountId) body.paid_from_account_id = remitAccountId;
      if (evidenceFileId) body.evidence_file_id = evidenceFileId;

      const result = await financeApi.batchRemitDeductions(body);
      showToast({ tone: "success", title: "Remitted", message: `${(result as any).updated} deduction(s) marked as remitted.` });
      setSelectedIds(new Set());
      setRemitRef("");
      setRemitDate("");
      setRemitAccountId("");
      setRemitFile(null);
      setRemitOpen(false);
      void fetchDeductions(page);
    } catch {
      showToast({ tone: "danger", title: "Remit failed", message: "Failed to remit deductions." });
    } finally {
      setRemitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const pending = deductions.filter((d) => d.status === "pending");
    if (selectedIds.size === pending.length && pending.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((d) => d.id)));
    }
  };

  const pendingRows = deductions.filter((d) => d.status === "pending");

  const downloadBase64Pdf = (res: { file_name: string; content_base64: string }) => {
    const bytes = Uint8Array.from(atob(res.content_base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = res.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTrm = async (id: string) => {
    try {
      const res = await financeApi.downloadTrmSlip(id);
      downloadBase64Pdf(res as any);
    } catch {
      showToast({ tone: "danger", title: "Download failed", message: "Could not generate TRM slip." });
    }
  };

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-statutory-deductions"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Statutory Deductions" }]}
        title="Statutory Deductions"
        description="Track and remit withheld statutory amounts across all requests."
      />

      <SectionCard
        title="Deductions Register"
        action={
          <Button
            variant="primary"
            disabled={selectedIds.size === 0}
            onClick={() => setRemitOpen(true)}
          >
            <Icon name="CheckSquare" className="w-4 h-4 mr-1" />
            Remit ({selectedIds.size})
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <TextField
              label="Search request"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") void fetchDeductions(1); }}
            />
          </div>
          <div className="w-40">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="remitted">Remitted</option>
            </SelectField>
          </div>
          <Button onClick={() => void fetchDeductions(1)} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white overflow-x-auto">
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>
                  <input
                    type="checkbox"
                    checked={pendingRows.length > 0 && selectedIds.size === pendingRows.length}
                    onChange={toggleAll}
                    aria-label="Select all pending"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Request</TableHeaderCell>
                <TableHeaderCell>Deduction Type</TableHeaderCell>
                <TableHeaderCell>Gross</TableHeaderCell>
                <TableHeaderCell>Withheld</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>TRM Ref</TableHeaderCell>
                <TableHeaderCell>Remitted</TableHeaderCell>
                <TableHeaderCell>Account</TableHeaderCell>
                <TableHeaderCell>{" "}</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {deductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                    {loading ? "Loading..." : "No deductions found."}
                  </TableCell>
                </TableRow>
              ) : (
                deductions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                        disabled={d.status === "remitted"}
                        aria-label={`Select ${d.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-brand-700 underline text-sm font-medium"
                        onClick={() => navigate(`/requests/${d.request_id}`)}
                      >
                        {d.request_number || d.request_id}
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{d.deduction_type_name}</p>
                      <p className="text-xs text-slate-400">{d.deduction_type_code}</p>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(d.gross_amount, "NGN")}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(d.amount, "NGN")}</TableCell>
                    <TableCell>
                      <Chip variant={d.status === "remitted" ? "success" : "warning"}>
                        {d.status === "remitted" ? "Remitted" : "Pending"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {d.remittance_number ? (
                        <p className="text-sm font-mono font-semibold text-slate-800">{d.remittance_number}</p>
                      ) : "—"}
                      {d.remittance_ref && (
                        <p className="text-xs text-slate-400 mt-0.5">{d.remittance_ref}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.remitted_at ? formatDisplayDate(d.remitted_at) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {d.paid_from_account?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {d.status === "remitted" && d.remittance_number && (
                        <button
                          type="button"
                          onClick={() => void handleDownloadTrm(d.id)}
                          className="text-xs font-semibold text-brand-700 hover:underline whitespace-nowrap"
                        >
                          TRM Slip
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.total_pages > 1 && (
          <div className="mt-3 flex gap-2 items-center">
            <Button variant="secondary" disabled={page <= 1} onClick={() => void fetchDeductions(page - 1)}>Prev</Button>
            <span className="text-sm text-slate-600">Page {page} of {pagination.total_pages} ({pagination.total} total)</span>
            <Button variant="secondary" disabled={page >= pagination.total_pages} onClick={() => void fetchDeductions(page + 1)}>Next</Button>
          </div>
        )}
      </SectionCard>

      <SlideOver open={remitOpen} onClose={() => setRemitOpen(false)} size="sm">
        <div className="space-y-4 p-4">
          <h3 className="font-semibold text-slate-800">Remit Deductions</h3>
          <p className="text-sm text-slate-600">
            {selectedIds.size} deduction(s) selected. Each will receive a unique TRM reference number.
          </p>

          <TextField
            label="Remittance Reference *"
            value={remitRef}
            onChange={(e) => setRemitRef(e.target.value)}
            placeholder="e.g. FIRS/WHT/2026/Q1"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={remitDate}
              onChange={(e) => setRemitDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paid From Account</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={remitAccountId}
              onChange={(e) => setRemitAccountId(e.target.value)}
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.bank_name ? ` — ${a.bank_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evidence (receipt)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              onChange={(e) => setRemitFile(e.target.files?.[0] ?? null)}
            />
            {remitFile && (
              <p className="mt-1 text-xs text-slate-500">{remitFile.name}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={() => setRemitOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => void handleRemit()}
              disabled={!remitRef.trim() || remitting || remitFileUploading}
            >
              {remitFileUploading ? "Uploading..." : remitting ? "Remitting..." : "Confirm Remit"}
            </Button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
