import { useEffect, useState } from "react";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { Button, StatCard, TextField, useToast } from "@/shared";

type Signatory = { name: string; title: string };

export default function NonprofitSetupTab() {
  const { showToast } = useToast();
  const { data: settingsData, refetch } = useCachedQuery(
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

  const getSig = (key: string): Signatory => {
    const v = settings[key] as { name?: string; title?: string } | undefined;
    return { name: v?.name ?? "", title: v?.title ?? "" };
  };

  const [preparedBy, setPreparedBy] = useState<Signatory>({ name: "", title: "" });
  const [reviewedBy, setReviewedBy] = useState<Signatory>({ name: "", title: "" });
  const [approvedBy, setApprovedBy] = useState<Signatory>({ name: "", title: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setPreparedBy(getSig("prepared_by"));
      setReviewedBy(getSig("reviewed_by"));
      setApprovedBy(getSig("approved_by"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await financeApi.updateSettings({
        prepared_by: preparedBy,
        reviewed_by: reviewedBy,
        approved_by: approvedBy,
      });
      showToast({ tone: "success", title: "Saved", message: "Signatory settings updated." });
      refetch?.();
    } catch {
      showToast({ tone: "danger", title: "Save failed", message: "Could not update signatory settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-headline text-lg font-semibold text-slate-950">Nonprofit Setup</h3>
        <p className="text-sm text-slate-500">Donors, funds, grants, and signature setup.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Donors" value={String(donors.length)} tone="neutral" />
        <StatCard label="Funds" value={String(funds.length)} tone="neutral" />
        <StatCard label="Grants" value={String(grants.length)} tone="neutral" />
        <StatCard
          label="Prepared By"
          value={preparedBy.name || "Not set"}
          tone="neutral"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">PDF Signatories</p>
        <p className="text-sm text-slate-500">These names appear in the Approvals section of all request and payment voucher PDFs.</p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Prepared By (Accountant)</p>
            <TextField label="Name" value={preparedBy.name} onChange={(e) => setPreparedBy((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Dunsin Babatunde" />
            <TextField label="Title" value={preparedBy.title} onChange={(e) => setPreparedBy((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Accountant" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Reviewed By (COO)</p>
            <TextField label="Name" value={reviewedBy.name} onChange={(e) => setReviewedBy((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Olalekan Owonikoko" />
            <TextField label="Title" value={reviewedBy.title} onChange={(e) => setReviewedBy((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Finance Manager / COO" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Approved By (ED)</p>
            <TextField label="Name" value={approvedBy.name} onChange={(e) => setApprovedBy((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Olusola Owonikoko" />
            <TextField label="Title" value={approvedBy.title} onChange={(e) => setApprovedBy((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Executive Director" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save Signatories"}
          </Button>
        </div>
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
