import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Chip,
  EmptyState,
  Icon,
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
import type { CustomerRecord, PartyTransaction } from "@stanforte/shared";

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

function CustomerTransactionsTab({ customerId }: { customerId: string }) {
  const { data: transactions } = useCachedQuery(
    `finance:customer:${customerId}:transactions`,
    () => financeApi.getCustomerTransactions(customerId),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(transactions) ? transactions : [];

  if (!rows.length) {
    return <EmptyState title="No transactions" description="Transactions will appear here once recorded." />;
  }

  return (
    <Table caption="Customer transactions">
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

function CustomerDetailView({ customerId }: { customerId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"info" | "transactions">("info");

  const { data: customer } = useCachedQuery(
    `finance:customer:${customerId}`,
    () => financeApi.getCustomer(customerId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const customerData = customer as CustomerRecord | undefined;

  if (!customerData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading customer details...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Customers", path: "/finance/customers" },
          { label: customerData.name || customerId.slice(0, 8) },
        ]}
        title={customerData.name || "Customer Details"}
        actions={
          <Button variant="secondary" onClick={() => setSearchParams({})}>
            Back to List
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Outstanding" value={asMoney(customerData.outstanding_amount)} tone="warning" />
        <StatCard label="Credit Limit" value={asMoney(customerData.credit_limit)} tone="neutral" />
        <StatCard label="Status" value={customerData.is_active ? "Active" : "Inactive"} tone={customerData.is_active ? "success" : "neutral"} />
        <StatCard label="Code" value={customerData.code || "-"} tone="neutral" />
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
                <TableCell className="font-semibold">{customerData.name || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Email</TableCell>
                <TableCell>{customerData.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Phone</TableCell>
                <TableCell>{customerData.phone || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Address</TableCell>
                <TableCell>{customerData.address || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">City</TableCell>
                <TableCell>{customerData.city || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Country</TableCell>
                <TableCell>{customerData.country || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">PAN</TableCell>
                <TableCell>{customerData.pan || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">TPIN</TableCell>
                <TableCell>{customerData.tpin || "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      ) : (
        <CustomerTransactionsTab customerId={customerId} />
      )}
    </>
  );
}

export default function FinanceCustomersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get("id");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      status: status !== "all" ? status : undefined,
      q: search.trim() || undefined,
    }),
    [status, search],
  );

  const { data: customersData, loading, error } = useCachedQuery(
    `finance:customers:${JSON.stringify(query)}`,
    () => financeApi.listCustomers(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const customers = Array.isArray(customersData) ? customersData : [];

  const stats = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + Number(c.outstanding_amount || 0), 0);
    return { totalOutstanding, count: customers.length };
  }, [customers]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  if (customerId) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-customers"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <CustomerDetailView customerId={customerId} />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-customers"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Customers" }]}
        title="Customers"
        description="Manage customer accounts and track receivables."
        actions={<Button>Add Customer</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Customers" value={String(stats.count)} tone="neutral" />
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

      <SectionCard title="Customer List">
        {loading ? <p className="text-sm text-slate-500">Loading customers...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {customers.length ? (
          <Table caption="Customers">
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
              {customers.map((customer: CustomerRecord) => (
                <TableRow key={customer.id} onClick={() => setSearchParams({ id: customer.id })}>
                  <TableCell className="font-medium">{customer.name || "-"}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell className="text-right">{asMoney(customer.outstanding_amount)}</TableCell>
                  <TableCell>
                    <Chip variant={customer.is_active ? "success" : "neutral"}>{customer.is_active ? "Active" : "Inactive"}</Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading ? (
          <EmptyState title="No customers" description="Customers will appear here once added." />
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
