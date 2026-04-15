import { useState } from "react";
import {
  AppShell,
  Button,
  Chip,
  Icon,
  PageHeader,
  PaginationControls,
  SectionCard,
  SelectField,
  StatCard,
  useToast,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { resourceApi, useCachedQuery } from "@/shared/lib/core";
import { buildAppMobileNav, buildAppNavigation } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { formatCurrency } from "@stanforte/shared";
import { formatDate } from "@/shared/lib/formatting";

export default function FinanceIncomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [listKey, setListKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_id: "",
    amount: "",
    currency: "NGN",
    received_at: new Date().toISOString().slice(0, 10),
    reference: "",
    payer: "",
    notes: "",
    fund_id: "",
    grant_id: "",
  });

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: incomeData, loading, refetch } = useCachedQuery(
    `finance:income:${listKey}:${search}:${page}:${perPage}`,
    () =>
      resourceApi.listFinanceIncome({
        search: search || undefined,
        page,
        per_page: perPage,
      }),
    { ttlMs: 0, storage: "memory" },
  );

  const { data: accounts } = useCachedQuery(
    "finance:accounts:all",
    () => resourceApi.listFinanceAccounts({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: funds } = useCachedQuery(
    "finance:funds:all",
    () => resourceApi.listChartAccounts({ is_active: true, type: "income" }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const income = Array.isArray(incomeData) ? incomeData : [];
  const totalAmount = income.reduce(
    (sum: number, entry: any) => sum + Number(entry.amount ?? 0),
    0,
  );

  const openCreate = () => {
    setForm({
      account_id: "",
      amount: "",
      currency: "NGN",
      received_at: new Date().toISOString().slice(0, 10),
      reference: "",
      payer: "",
      notes: "",
      fund_id: "",
      grant_id: "",
    });
    setShowModal(true);
  };

  const saveIncome = async () => {
    if (!form.account_id || !form.amount) {
      showToast({
        tone: "warning",
        title: "Missing fields",
        message: "Account and amount are required.",
      });
      return;
    }
    setSaving(true);
    try {
      await resourceApi.createFinanceIncome({
        account_id: form.account_id,
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        received_at: form.received_at,
        reference: form.reference || undefined,
        payer: form.payer || undefined,
        notes: form.notes || undefined,
        fund_id: form.fund_id || undefined,
        grant_id: form.grant_id || undefined,
      });
      setShowModal(false);
      setListKey((k) => k + 1);
      showToast({
        tone: "success",
        title: "Saved",
        message: "Income recorded successfully.",
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message:
          error instanceof Error ? error.message : "Unable to save income.",
      });
    } finally {
      setSaving(false);
    }
  };

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance";

  return (
    <AppShell
      navigation={buildAppNavigation({ requestDetailsParent: "finance" })}
      activeLabel="finance-income"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Finance",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Income" },
        ]}
        title="Income"
        description="Record and track income receipts."
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Entries"
            value={String(income.length)}
            tone="neutral"
          />
          <StatCard
            label="Total Amount"
            value={formatCurrency(totalAmount)}
            tone="neutral"
          />
          <StatCard label="This Page" value={String(income.length)} tone="neutral" />
        </div>

        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm flex-1 min-w-[180px]">
              <span className="font-semibold text-slate-700">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by payer, reference"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              />
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
            >
              <Icon name="refresh" className="text-[16px]" />
              Refresh
            </Button>
          </div>
        </section>

        <SectionCard
          title="All Income"
          description={`${income.length} entr${income.length === 1 ? "y" : "ies"}`}
          action={
            <Button onClick={openCreate}>
              <Icon name="add" className="text-[18px]" />
              Record Income
            </Button>
          }
        >
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading income...
            </div>
          ) : income.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-8 text-sm text-slate-500">
              No income entries found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-left font-semibold text-slate-600">
                      Date
                    </th>
                    <th className="p-3 text-left font-semibold text-slate-600">
                      Payer
                    </th>
                    <th className="p-3 text-left font-semibold text-slate-600">
                      Account
                    </th>
                    <th className="p-3 text-left font-semibold text-slate-600">
                      Reference
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-600">
                      Amount
                    </th>
                    <th className="p-3 text-left font-semibold text-slate-600">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((entry: any) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 text-slate-600">
                        {formatDate(entry.received_at)}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {entry.payer || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        {entry.account_name || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        {entry.reference || "-"}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-900">
                        {formatCurrency(
                          Number(entry.amount ?? 0),
                          entry.currency || "NGN",
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">
                        {entry.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={1}
            totalCount={income.length}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            onPageChange={setPage}
          />
        </SectionCard>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Record Income
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                <Icon name="close" />
              </Button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <SelectField
                label="Received Into Account"
                value={form.account_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, account_id: e.target.value }))
                }
              >
                <option value="">Select account</option>
                {(Array.isArray(accounts) ? accounts : []).map(
                  (account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ),
                )}
              </SelectField>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">
                  Amount <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Currency</span>
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">
                  Date Received
                </span>
                <input
                  type="date"
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  value={form.received_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, received_at: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Payer</span>
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  value={form.payer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payer: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Reference</span>
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  value={form.reference}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reference: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Notes</span>
                <textarea
                  className="rounded-2xl border border-slate-200 px-4 py-2.5"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => void saveIncome()} disabled={saving}>
                {saving ? "Saving..." : "Record Income"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
