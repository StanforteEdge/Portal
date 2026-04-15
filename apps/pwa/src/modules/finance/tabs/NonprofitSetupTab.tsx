import { useState } from "react";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { Button, EmptyState, StatCard } from "@/shared";

export default function NonprofitSetupTab() {
  const { data: settingsData } = useCachedQuery(
    "finance:settings:doc",
    () => financeApi.getSettings(),
    { ttlMs: 60_000, storage: "memory" },
  );
  const { data: donorsData } = useCachedQuery(
    "finance:settings:donors",
    () => financeApi.listDonors(),
    { ttlMs: 60_000, storage: "memory" },
  );
  const { data: fundsData } = useCachedQuery(
    "finance:settings:funds",
    () => financeApi.listFunds(),
    { ttlMs: 60_000, storage: "memory" },
  );
  const { data: grantsData } = useCachedQuery(
    "finance:settings:grants",
    () => financeApi.listGrants(),
    { ttlMs: 60_000, storage: "memory" },
  );
  const donors = Array.isArray(donorsData) ? donorsData : [];
  const funds = Array.isArray(fundsData) ? fundsData : [];
  const grants = Array.isArray(grantsData) ? grantsData : [];
  const settings = (settingsData ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <h3 className="font-headline text-lg font-semibold text-slate-950">Nonprofit Setup</h3>
      <p className="text-sm text-slate-500">Donors, funds, grants, and signature setup.</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Donors" value={String(donors.length)} tone="neutral" />
        <StatCard label="Funds" value={String(funds.length)} tone="neutral" />
        <StatCard label="Grants" value={String(grants.length)} tone="neutral" />
        <StatCard
          label="Prepared By"
          value={String((settings.prepared_by as { name?: string } | undefined)?.name || "Not set")}
          tone="neutral"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">Add Donor</Button>
          <Button variant="secondary" size="sm">Add Fund</Button>
          <Button variant="secondary" size="sm">Add Grant</Button>
        </div>
      </div>
    </div>
  );
}
