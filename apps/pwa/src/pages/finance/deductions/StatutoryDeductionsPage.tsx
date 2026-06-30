import { useState } from "react";
import {
  Button, Icon, PageHeader,
  Table, TableHead, TableHeaderRow, TableHeaderCell,
  TableRow, TableCell, TableBody,
  TextField, SelectField, useToast, SlideOver,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import type { FinanceRequestDeductionRecord } from "@/shared";
import { useNavigate } from "react-router-dom";

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
  const [remitting, setRemitting] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; total: number; total_pages: number } | null>(null);
  const [page, setPage] = useState(1);

  const fetchDeductions = async (p = 1) => {
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
  };

  const handleRemit = async () => {
    if (!remitRef.trim()) return;
    setRemitting(true);
    try {
      const result = await financeApi.batchRemitDeductions({
        deduction_ids: Array.from(selectedIds),
        reference: remitRef.trim(),
      });
      showToast({ tone: "success", title: "Remitted", message: `${(result as any).updated} deduction(s) marked as remitted.` });
      setSelectedIds(new Set());
      setRemitRef("");
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

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
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
          <Button
            variant="primary"
            disabled={selectedIds.size === 0}
            onClick={() => setRemitOpen(true)}
          >
            <Icon name="CheckSquare" className="w-4 h-4 mr-1" />
            Remit ({selectedIds.size})
          </Button>
        </div>

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
              <TableHeaderCell>Request ID</TableHeaderCell>
              <TableHeaderCell>Deduction Type</TableHeaderCell>
              <TableHeaderCell>Gross Amount</TableHeaderCell>
              <TableHeaderCell>Amount Withheld</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Remitted At</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {deductions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                  {loading ? "Loading..." : "No deductions found. Click Search to load."}
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
                      className="text-blue-600 underline text-sm"
                      onClick={() => navigate(`/requests/${d.request_id}`)}
                    >
                      {d.request_id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{d.deduction_type_name}</div>
                    <div className="text-xs text-slate-400">{d.deduction_type_code}</div>
                  </TableCell>
                  <TableCell>{Number(d.gross_amount).toLocaleString()}</TableCell>
                  <TableCell>{Number(d.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === "remitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell>{d.remitted_at ? new Date(d.remitted_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{d.remittance_ref ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && pagination.total_pages > 1 && (
          <div className="flex gap-2 items-center">
            <Button variant="secondary" disabled={page <= 1} onClick={() => void fetchDeductions(page - 1)}>Prev</Button>
            <span className="text-sm text-slate-600">Page {page} of {pagination.total_pages} ({pagination.total} total)</span>
            <Button variant="secondary" disabled={page >= pagination.total_pages} onClick={() => void fetchDeductions(page + 1)}>Next</Button>
          </div>
        )}
      </div>

      <SlideOver open={remitOpen} onClose={() => setRemitOpen(false)} size="sm">
        <div className="space-y-4 p-4">
          <h3 className="font-semibold text-slate-800">Remit Deductions</h3>
          <p className="text-sm text-slate-600">{selectedIds.size} deduction(s) selected for remittance.</p>
          <TextField
            label="Remittance Reference *"
            value={remitRef}
            onChange={(e) => setRemitRef(e.target.value)}
            placeholder="e.g. WHT-remit-2026-001"
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={() => setRemitOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void handleRemit()} disabled={!remitRef.trim() || remitting}>
              {remitting ? "Remitting..." : "Confirm Remit"}
            </Button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
