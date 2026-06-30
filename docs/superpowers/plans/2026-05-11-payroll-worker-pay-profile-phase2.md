# Payroll Worker Pay Profile — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cost allocation mode, default fund/grant, and allocation rows as Step 3 of the worker wizard.

**Architecture:** No backend changes needed. Expand `UpsertWorkerPayload` type, add fetch calls for orgs/teams/projects/funds/grants via existing `resourceApi`/`financeApi`, extend wizard to 3 steps.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing PWA component library.

---

### Task 1: Expand `UpsertWorkerPayload` with allocation fields

**Files:**
- Modify: `apps/pwa/src/shared/api/payroll-api.ts`

- [ ] **Step 1: Add allocation fields to `UpsertWorkerPayload`**

Add these fields to the existing `UpsertWorkerPayload` type:

```typescript
  organization_id?: string;
  team_id?: string;
  project_id?: string;
  default_fund_id?: string;
  default_grant_id?: string;
  allocation_mode?: string;
  hybrid_fixed_percent?: number;
  allocations?: Array<{
    organization_id?: string;
    team_id?: string;
    project_id?: string;
    fund_id?: string;
    grant_id?: string;
    allocation_percent?: number;
    allocation_amount?: number;
  }>;
```

Insert them after `notes?: string;` and before `standard_hours_per_day?: number;`.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: add allocation fields to UpsertWorkerPayload"
```

---

### Task 2: Add Step 3 — Allocation UI

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

This is the largest change. Read the current file first — it has a 3-step wizard structure already (identity/pay). You need to add a third step "Allocation".

- [ ] **Step 1: Add imports for `resourceApi` and `financeApi`**

After existing imports from `@/shared/lib/core` (which already has `hrApi`), add:

```typescript
import { resourceApi, financeApi } from "@/shared/lib/core";
```

- [ ] **Step 2: Add state variables for allocation fields**

After the existing profile component state variables, add:

```typescript
const [allocationMode, setAllocationMode] = useState("fixed");
const [hybridFixedPercent, setHybridFixedPercent] = useState("0");
const [defaultFundId, setDefaultFundId] = useState("");
const [defaultGrantId, setDefaultGrantId] = useState("");
const [allocations, setAllocations] = useState<Array<{ _key: number; org_id: string; team_id: string; project_id: string; fund_id: string; grant_id: string; percent: string }>>([
  { _key: nextPcKey(), org_id: "", team_id: "", project_id: "", fund_id: "", grant_id: "", percent: "100" },
]);
const [organizations, setOrganizations] = useState<any[]>([]);
const [teams, setTeams] = useState<any[]>([]);
const [projects, setProjects] = useState<any[]>([]);
const [funds, setFunds] = useState<any[]>([]);
const [grants, setGrants] = useState<any[]>([]);
```

- [ ] **Step 3: Fetch reference data in `openCreate`**

In `openCreate`, after the `listPayrollComponents()` call, add:

```typescript
  setAllocationMode("fixed");
  setHybridFixedPercent("0");
  setDefaultFundId("");
  setDefaultGrantId("");
  setAllocations([{ _key: nextPcKey(), org_id: "", team_id: "", project_id: "", fund_id: "", grant_id: "", percent: "100" }]);
  Promise.allSettled([
    resourceApi.listOrganizations(),
    resourceApi.listGroups({ active_only: true }),
    resourceApi.listProjects({ active_only: true }),
    financeApi.listFunds(),
    financeApi.listGrants(),
  ]).then(([orgs, tms, projs, fds, grnts]) => {
    if (orgs.status === "fulfilled") setOrganizations(orgs.value);
    if (tms.status === "fulfilled") setTeams(tms.value);
    if (projs.status === "fulfilled") setProjects(projs.value);
    if (fds.status === "fulfilled") setFunds(fds.value);
    if (grnts.status === "fulfilled") setGrants(grnts.value);
  });
```

- [ ] **Step 4: Extend the step indicator**

Change the `steps` array from 2 steps to 3:

```typescript
{[{ id: "identity" as const, label: "Identity" }, { id: "pay" as const, label: "Pay Profile" }, { id: "allocation" as const, label: "Allocation" }].map(...)}
```

And update `editorStep` type and `useState` to include `"allocation"`:

```typescript
const [editorStep, setEditorStep] = useState<"identity" | "pay" | "allocation">("identity");
```

- [ ] **Step 5: Add Step 3 — Allocation JSX**

After the closing `}` of the Step 2 (Pay Profile) block and before `</SlideOverContent>`, add:

```tsx
          {/* Step 3: Allocation */}
          {editorStep === "allocation" ? (
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cost Allocation</p>
              <div className="rounded-lg border border-slate-200 p-4 grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <SelectField label="Allocation Mode" value={allocationMode} onChange={(e) => setAllocationMode(e.target.value)}>
                      <option value="fixed">Fixed Allocation</option>
                      <option value="timesheet">Timesheet Driven</option>
                      <option value="hybrid">Hybrid Fixed + Timesheet</option>
                    </SelectField>
                    <p className="mt-1 text-xs text-slate-500">
                      {allocationMode === "fixed"
                        ? "Uses the worker allocation rows directly."
                        : allocationMode === "timesheet"
                        ? "Reads approved project/fund/grant time splits from the payroll run."
                        : "Blends fixed allocation with timesheet splits using the fixed share percentage."}
                    </p>
                  </div>
                  {allocationMode === "hybrid" ? (
                    <TextField
                      label="Fixed Allocation Share %"
                      type="number"
                      value={hybridFixedPercent}
                      onChange={(e) => setHybridFixedPercent(e.target.value)}
                    />
                  ) : null}
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Default Fund & Grant</p>
              <div className="rounded-lg border border-slate-200 p-4 grid grid-cols-2 gap-4">
                <SelectField label="Default Fund" value={defaultFundId} onChange={(e) => setDefaultFundId(e.target.value)}>
                  <option value="">No default fund</option>
                  {funds.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </SelectField>
                <SelectField label="Default Grant" value={defaultGrantId} onChange={(e) => setDefaultGrantId(e.target.value)}>
                  <option value="">No default grant</option>
                  {grants.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </SelectField>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allocation Breakdown</p>
              <div className="rounded-lg border border-slate-200 p-4 grid gap-3">
                {allocations.map((row) => (
                  <div key={row._key} className="grid grid-cols-12 gap-3 rounded border border-slate-100 bg-slate-50 p-3">
                    <div className="col-span-12 md:col-span-2">
                      <SelectField label="Organization" value={row.org_id} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], org_id: e.target.value };
                        setAllocations(updated);
                      }}>
                        <option value="">Select</option>
                        {organizations.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </SelectField>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <SelectField label="Team" value={row.team_id} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], team_id: e.target.value };
                        setAllocations(updated);
                      }}>
                        <option value="">Select</option>
                        {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </SelectField>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <SelectField label="Project" value={row.project_id} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], project_id: e.target.value };
                        setAllocations(updated);
                      }}>
                        <option value="">Select</option>
                        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </SelectField>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <SelectField label="Fund" value={row.fund_id} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], fund_id: e.target.value };
                        setAllocations(updated);
                      }}>
                        <option value="">Select</option>
                        {funds.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </SelectField>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <SelectField label="Grant" value={row.grant_id} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], grant_id: e.target.value };
                        setAllocations(updated);
                      }}>
                        <option value="">Select</option>
                        {grants.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </SelectField>
                    </div>
                    <div className="col-span-10 md:col-span-1">
                      <TextField label="%" type="number" value={row.percent} onChange={(e) => {
                        const updated = [...allocations];
                        const idx = allocations.findIndex((r) => r._key === row._key);
                        updated[idx] = { ...updated[idx], percent: e.target.value };
                        setAllocations(updated);
                      }} />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setAllocations(allocations.filter((r) => r._key !== row._key))}>
                        <Icon name="delete" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Total: {allocations.reduce((sum, r) => sum + Number(r.percent || 0), 0)}%
                  </span>
                  <Button variant="secondary" size="sm" onClick={() =>
                    setAllocations([...allocations, { _key: nextPcKey(), org_id: "", team_id: "", project_id: "", fund_id: "", grant_id: "", percent: "0" }])
                  }>
                    <Icon name="add" className="text-[18px]" />
                    Add Row
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
```

- [ ] **Step 6: Update the footer navigation**

The footer currently has buttons for 2 steps. It needs to work for 3 steps. The logic:

```tsx
<SlideOverFooter>
  <div className="flex w-full items-center justify-between">
    <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
    <div className="flex gap-2">
      {editorStep !== "identity" ? (
        <Button variant="secondary" onClick={() => setEditorStep(editorStep === "pay" ? "identity" : "pay")}>Previous</Button>
      ) : null}
      {editorStep !== "allocation" ? (
        <Button onClick={() => setEditorStep(editorStep === "identity" ? "pay" : "allocation")}>Next</Button>
      ) : null}
      {editorStep === "allocation" ? (
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : editingWorker ? "Update" : "Add Worker"}
        </Button>
      ) : null}
    </div>
  </div>
</SlideOverFooter>
```

This uses dynamic step mapping: Previous goes back one step, Next goes forward, Save appears only on the last step.

- [ ] **Step 7: Run typecheck and build**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
npm run build --workspace=apps/pwa 2>&1 | tail -5
```

Expected: no errors, build succeeds

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx
git commit -m "feat: add Step 3 allocation UI with mode, fund/grant, and allocation rows"
```

---

### Task 3: Wire allocation fields in openEdit and handleSave

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Extend `openEdit` to populate allocation fields**

In `openEdit`, after the existing profile population code (after `setProfileComponents(...)`) and before `setEditorStep("identity")`, add:

```typescript
    setAllocationMode(w.allocation_mode || "fixed");
    setHybridFixedPercent(w.hybrid_fixed_percent != null ? String(w.hybrid_fixed_percent) : "0");
    setDefaultFundId(w.default_fund_id || "");
    setDefaultGrantId(w.default_grant_id || "");
    setAllocations(
      w.allocations?.length > 0
        ? w.allocations.map((a: any) => ({
            _key: nextPcKey(),
            org_id: a.organization_id || "",
            team_id: a.team_id || "",
            project_id: a.project_id || "",
            fund_id: a.fund_id || "",
            grant_id: a.grant_id || "",
            percent: String(a.allocation_percent ?? "0"),
          }))
        : [{ _key: nextPcKey(), org_id: "", team_id: "", project_id: "", fund_id: "", grant_id: "", percent: "100" }],
    );
```

Also add the same reference data fetch in `openEdit` alongside the existing `listPayrollComponents()` call:

```typescript
    Promise.allSettled([
      resourceApi.listOrganizations(),
      resourceApi.listGroups({ active_only: true }),
      resourceApi.listProjects({ active_only: true }),
      financeApi.listFunds(),
      financeApi.listGrants(),
    ]).then(([orgs, tms, projs, fds, grnts]) => {
      if (orgs.status === "fulfilled") setOrganizations(orgs.value);
      if (tms.status === "fulfilled") setTeams(tms.value);
      if (projs.status === "fulfilled") setProjects(projs.value);
      if (fds.status === "fulfilled") setFunds(fds.value);
      if (grnts.status === "fulfilled") setGrants(grnts.value);
    });
```

- [ ] **Step 2: Extend `handleSave` to include allocation payload**

In `handleSave`, after the existing `profile` block construction and before the API call, add at the end of the payload object:

Note the payload currently looks like:
```typescript
const payload: UpsertWorkerPayload = {
  ...form,
  full_name: form.full_name.trim(),
  email: form.email?.trim() || undefined,
  staff_code: form.staff_code?.trim() || undefined,
  bank_name: form.bank_name?.trim() || undefined,
  bank_account_name: form.bank_account_name?.trim() || undefined,
  bank_account_number: form.bank_account_number?.trim() || undefined,
  tax_identifier: form.tax_identifier?.trim() || undefined,
  pension_identifier: form.pension_identifier?.trim() || undefined,
  start_date: form.start_date || undefined,
  end_date: form.end_date || undefined,
  standard_hours_per_day: standardHours ? Number(standardHours) : undefined,
  ...(hasProfileFields
    ? {
        profile: {
          effective_from: effectiveFrom || new Date().toISOString().slice(0, 10),
          ...(effectiveTo ? { effective_to: effectiveTo } : {}),
          ...(baseAmount ? { base_amount: Number(baseAmount) } : {}),
          payment_mode: paymentMode,
          pay_frequency: "monthly",
          ...(componentRows.length > 0 ? { components: componentRows } : {}),
        },
      }
    : {}),
};
```

Add the allocation fields after the profile block:

```typescript
  allocation_mode: allocationMode,
  ...(allocationMode === "hybrid" ? { hybrid_fixed_percent: Number(hybridFixedPercent || 0) } : {}),
  default_fund_id: defaultFundId || undefined,
  default_grant_id: defaultGrantId || undefined,
  allocations: allocations
    .filter((a) => a.org_id || a.team_id || a.project_id || a.fund_id || a.grant_id)
    .map((a) => ({
      ...(a.org_id ? { organization_id: a.org_id } : {}),
      ...(a.team_id ? { team_id: a.team_id } : {}),
      ...(a.project_id ? { project_id: a.project_id } : {}),
      ...(a.fund_id ? { fund_id: a.fund_id } : {}),
      ...(a.grant_id ? { grant_id: a.grant_id } : {}),
      allocation_percent: Number(a.percent || 0),
    })),
```

Place these after line `...(componentRows.length > 0 ? { components: componentRows } : {}),` and before the closing `},` of the profile block, OR at the top level of the payload after the profile block.

- [ ] **Step 3: Run typecheck and build**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
npm run build --workspace=apps/pwa 2>&1 | tail -5
```

Expected: no errors, build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: wire allocation save logic and edit population"
```
