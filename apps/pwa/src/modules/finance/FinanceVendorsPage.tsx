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
import type { VendorRecord, PartyTransaction } from "@stanforte/shared";

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

function VendorTransactionsTab({ vendorId }: { vendorId: string }) {
  const { data: transactions } = useCachedQuery(
    `finance:vendor:${vendorId}:transactions`,
    () => financeApi.getVendorTransactions(vendorId),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(transactions) ? transactions : [];

  if (!rows.length) {
    return <EmptyState title="No transactions" description="Transactions will appear here once recorded." />;
  }

  return (
    <Table caption="Vendor transactions">
      <TableHead>
        <TableHeaderRow>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell className="text-right">Amount</TableHeaderCell>
          <TableHeaderCell className="text-right">Balance</TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {rows.map((tx: PartyTransaction) => (
          <TableRow key={tx.id}>
            <TableCell>{asDate(tx.date)}</TableCell>
            <TableCell>
              <Chip
                variant={
                  tx.type === "invoice"
                    ? "warning"
                    : tx.type === "payment" || tx.type === "receipt"
                      ? "success"
                      : "neutral"
                }
              >
                {tx.type.replace("_", " ")}
              </Chip>
            </TableCell>
            <TableCell>{tx.reference || "-"}</TableCell>
            <TableCell className="text-right">{asMoney(tx.amount)}</TableCell>
            <TableCell className="text-right">{asMoney(tx.balance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function VendorDetailView({ vendorId }: { vendorId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"info" | "transactions">("info");

  const { data: vendor } = useCachedQuery(
    `finance:vendor:${vendorId}`,
    () => financeApi.getVendor(vendorId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const vendorData = vendor as VendorRecord | undefined;

  if (!vendorData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Vendors", path: "/finance/vendors" },
          { label: vendorData.name || vendorId.slice(0, 8) },
        ]}
        title={vendorData.name || "Vendor Details"}
        actions={
          <Button variant="secondary" onClick={() => setSearchParams({})}>
            Back to List
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Outstanding" value={asMoney(vendorData.outstanding_amount)} tone="warning" />
        <StatCard label="Opening Balance" value={asMoney(vendorData.opening_balance)} tone="neutral" />
        <StatCard label="Status" value={vendorData.is_active ? "Active" : "Inactive"} tone={vendorData.is_active ? "success" : "neutral"} />
        <StatCard label="Code" value={vendorData.code || "-"} tone="neutral" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "info"
              ? "border-brand-900 text-brand-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "transactions"
              ? "border-brand-900 text-brand-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Transactions
        </button>
      </div>

      {activeTab === "info" ? (
        <SectionCard>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Name</TableCell>
                <TableCell className="font-semibold">{vendorData.name || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Email</TableCell>
                <TableCell>{vendorData.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Phone</TableCell>
                <TableCell>{vendorData.phone || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Address</TableCell>
                <TableCell>{vendorData.address || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">City</TableCell>
                <TableCell>{vendorData.city || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Country</TableCell>
                <TableCell>{vendorData.country || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Tax ID</TableCell>
                <TableCell>{vendorData.tax_id || "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      ) : (
        <VendorTransactionsTab vendorId={vendorId} />
      )}
    </>
  );
}

export default function FinanceVendorsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const vendorId = searchParams.get("id");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      status: status !== "all" ? status : undefined,
      q: search.trim() || undefined,
    }),
    [status, search],
  );

  const { data: vendorsData, loading, error } = useCachedQuery(
    `finance:vendors:${JSON.stringify(query)}`,
    () => financeApi.listVendors(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const vendors = Array.isArray(vendorsData) ? vendorsData : [];

  const stats = useMemo(() => {
    const totalOutstanding = vendors.reduce((sum, v) => sum + Number(v.outstanding_amount || 0), 0);
    return { totalOutstanding, count: vendors.length };
  }, [vendors]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  if (vendorId) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-vendors"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <VendorDetailView vendorId={vendorId} />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-vendors"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Vendors" }]}
        title="Vendors"
        description="Manage vendor accounts and track payables."
        actions={<Button>Add Vendor</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Vendors" value={String(stats.count)} tone="neutral" />
        <StatCard label="Total Outstanding" value={asMoney(stats.totalOutstanding)} tone="warning" />
      </div>

      <SectionCard title="Filters">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
          <TextField label="Search" placeholder="Name, email, or code" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Vendor List">
        {loading ? <p className="text-sm text-slate-500">Loading vendors...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {vendors.length ? (
          <Table caption="Vendors">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Outstanding</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor: VendorRecord) => (
                <TableRow key={vendor.id} onClick={() => setSearchParams({ id: vendor.id })}>
                  <TableCell className="font-medium">{vendor.name || "-"}</TableCell>
                  <TableCell>{vendor.email || "-"}</TableCell>
                  <TableCell>{vendor.phone || "-"}</TableCell>
                  <TableCell className="text-right">{asMoney(vendor.outstanding_amount)}</TableCell>
                  <TableCell>
                    <Chip variant={vendor.is_active ? "success" : "neutral"}>{vendor.is_active ? "Active" : "Inactive"}</Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No vendors" description="Vendors will appear here once added." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
