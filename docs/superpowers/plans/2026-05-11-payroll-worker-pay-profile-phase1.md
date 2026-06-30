# Payroll Worker Pay Profile — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add base amount, effective dates, and recurring salary components to the HR payroll worker editor so payroll runs generate non-zero amounts.

**Architecture:** No backend changes — `UpsertPayrollWorkerDto` already supports nested `profile` with `base_amount`, `effective_from`, and `components[]`. Only two files change: shared API types and the worker page slideover.

**Tech Stack:** React, TypeScript, Tailwind CSS, custom PWA components (SlideOver, Button, TextField, SelectField, Chip, etc.)

---

### Task 1: Expand `UpsertWorkerPayload` type

**Files:**
- Modify: `apps/pwa/src/shared/api/payroll-api.ts:227-244`

- [ ] **Step 1: Add nested profile types to the existing type**

Add a `ProfileComponent` type and expand `UpsertWorkerPayload` with `profile`, `standard_hours_per_day`, and related fields:

```typescript
export type ProfileComponentInput = {
  component_id: string;
  amount?: number;
  rate?: number;
  formula?: string;
};

export type WorkerProfileInput = {
  effective_from: string;
  effective_to?: string;
  base_amount?: number;
  payment_mode?: string;
  pay_frequency?: string;
  components?: ProfileComponentInput[];
};
```

Change `UpsertWorkerPayload` from:

```typescript
export type UpsertWorkerPayload = {
  full_name: string;
  worker_type: "employee" | "consultant";
  email?: string;
  staff_code?: string;
  currency?: string;
  status?: string;
  pay_basis?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  tax_identifier?: string;
  pension_identifier?: string;
  start_date?: string;
  end_date?: string;
  profile_id?: string;
  notes?: string;
};
```

To:

```typescript
export type UpsertWorkerPayload = {
  full_name: string;
  worker_type: "employee" | "consultant";
  email?: string;
  staff_code?: string;
  currency?: string;
  status?: string;
  pay_basis?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  tax_identifier?: string;
  pension_identifier?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  standard_hours_per_day?: number;
  profile?: WorkerProfileInput;
};
```

Remove the unused `profile_id?: string` field.

- [ ] **Step 2: Run typecheck to verify**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

Expected: no errors related to `UpsertWorkerPayload`

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: expand UpsertWorkerPayload with profile fields"
```

---

### Task 2: Add component fetch, form state, and step navigation

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Add new imports**

Add to existing imports at top of file:

```typescript
import { listPayrollComponents, type PayrollComponent } from "@/shared/api/payroll-api";
```

- [ ] **Step 2: Add new state variables**

Add these after the existing `const [deletingId, setDeletingId] = useState<string | null>(null);`:

```typescript
const [editorStep, setEditorStep] = useState<"identity" | "pay">("identity");
const [components, setComponents] = useState<PayrollComponent[]>([]);
const [baseAmount, setBaseAmount] = useState("");
const [effectiveFrom, setEffectiveFrom] = useState("");
const [effectiveTo, setEffectiveTo] = useState("");
const [paymentMode, setPaymentMode] = useState("bank_transfer");
const [standardHours, setStandardHours] = useState("8");
const [profileComponents, setProfileComponents] = useState<
  Array<{ component_id: string; amount: string; rate: string; formula: string }>
>([]);
```

- [ ] **Step 3: Reset state in `openCreate`**

Change `openCreate` to also reset step and profile fields:

```typescript
const openCreate = () => {
  setEditingWorker(null);
  setForm(EMPTY_FORM);
  setSearchQuery("");
  setSearchResults([]);
  setEditorStep("identity");
  setBaseAmount("");
  setEffectiveFrom("");
  setEffectiveTo("");
  setPaymentMode("bank_transfer");
  setStandardHours("8");
  setProfileComponents([]);
  setShowSlideOver(true);
  // Fetch component list
  listPayrollComponents().then((r) => setComponents(r.items)).catch(() => {});
};
```

- [ ] **Step 4: Run PWA typecheck**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx
git commit -m "feat: add pay profile state and component fetch"
```

---

### Task 3: Build step indicator and 2-step navigation

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Replace the slideover structure with step navigation**

Replace the `<SlideOver>` JSX beginning at line 313 with a version that includes a step indicator and conditional rendering.

**Before** (line 313-401):

```tsx
<SlideOver open={showSlideOver} onClose={() => setShowSlideOver(false)} size="md">
  <SlideOverHeader
    title={editingWorker ? "Edit Worker" : "Add Payroll Worker"}
    subtitle="Set up the worker's payroll profile, bank details, and identifiers."
    onClose={() => setShowSlideOver(false)}
  />
  <SlideOverContent>
    <div className="grid gap-4">
      {/* ... all existing form content ... */}
    </div>
  </SlideOverContent>
  <SlideOverFooter>
    <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
    <Button onClick={() => void handleSave()} disabled={saving}>
      {saving ? "Saving..." : editingWorker ? "Update" : "Add Worker"}
    </Button>
  </SlideOverFooter>
</SlideOver>
```

**After:**

```tsx
const steps = [
  { id: "identity" as const, label: "Identity" },
  { id: "pay" as const, label: "Pay Profile" },
];

// ... in the JSX, replace the entire SlideOver block:

<SlideOver open={showSlideOver} onClose={() => setShowSlideOver(false)} size="md">
  <SlideOverHeader
    title={editingWorker ? "Edit Worker" : "Add Payroll Worker"}
    subtitle="Set up the worker's payroll profile, bank details, and identifiers."
    onClose={() => setShowSlideOver(false)}
  />
  <SlideOverContent>
    {/* Step indicator */}
    <div className="mb-6 flex gap-2 border-b border-slate-200 pb-3">
      {steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setEditorStep(s.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            editorStep === s.id
              ? "bg-blue-50 text-blue-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              editorStep === s.id
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {i + 1}
          </span>
          {s.label}
        </button>
      ))}
    </div>

    {/* Step 1: Identity */}
    {editorStep === "identity" ? (
      <div className="grid gap-4">
        {/* existing form content from current slideover — identity fields */}
        {!editingWorker && (
          <div className="relative">
            <TextField
              label="Search Employee"
              value={searchQuery}
              onChange={(e) => void handleEmployeeSearch(e.target.value)}
              placeholder="Type to search employees..."
              helpText={searching ? "Searching..." : ""}
            />
            {searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                {searchResults.map((emp: any) => (
                  <button
                    key={emp.id}
                    type="button"
                    className="flex w-full flex-col gap-0.5 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                    onClick={() => selectEmployee(emp)}
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {emp.full_name ?? emp.name ?? `${emp.first_name} ${emp.last_name}`}
                    </span>
                    <span className="text-xs text-slate-500">{emp.email} {emp.staff_code ? `· ${emp.staff_code}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <TextField label="Full Name" value={form.full_name} onChange={setField("full_name")} placeholder="e.g. Jane Doe" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Worker Type" value={form.worker_type} onChange={setField("worker_type")}>
            <option value="employee">Employee</option>
            <option value="consultant">Consultant</option>
          </SelectField>
          <SelectField label="Status" value={form.status ?? "active"} onChange={setField("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Email" type="email" value={form.email ?? ""} onChange={setField("email")} placeholder="jane@company.com" />
          <TextField label="Staff Code" value={form.staff_code ?? ""} onChange={setField("staff_code")} placeholder="EMP-001" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Pay Basis" value={form.pay_basis ?? "monthly_fixed"} onChange={setField("pay_basis")}>
            <option value="monthly_fixed">Monthly Fixed</option>
            <option value="hourly_timesheet">Hourly / Timesheet</option>
            <option value="daily_rate">Daily Rate</option>
            <option value="retainer">Retainer</option>
            <option value="manual">Manual</option>
          </SelectField>
          <TextField label="Currency" value={form.currency ?? "NGN"} onChange={setField("currency")} placeholder="NGN" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Start Date" type="date" value={form.start_date ?? ""} onChange={setField("start_date")} />
          <TextField label="End Date" type="date" value={form.end_date ?? ""} onChange={setField("end_date")} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">Bank Details</p>
        <TextField label="Bank Name" value={form.bank_name ?? ""} onChange={setField("bank_name")} placeholder="e.g. First Bank" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Account Name" value={form.bank_account_name ?? ""} onChange={setField("bank_account_name")} />
          <TextField label="Account Number" value={form.bank_account_number ?? ""} onChange={setField("bank_account_number")} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">Tax & Pension</p>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Tax ID (TIN)" value={form.tax_identifier ?? ""} onChange={setField("tax_identifier")} />
          <TextField label="Pension ID (PFA)" value={form.pension_identifier ?? ""} onChange={setField("pension_identifier")} />
        </div>
      </div>
    ) : null}

    {/* Step 2: Pay Profile */}
    {editorStep === "pay" ? (
      <div className="grid gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pay Profile</p>
        <div className="rounded-lg border border-slate-200 p-4 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label={
                form.pay_basis === "hourly_timesheet"
                  ? "Hourly Rate"
                  : form.pay_basis === "daily_rate"
                  ? "Daily Rate"
                  : "Base Amount"
              }
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              placeholder="0.00"
            />
            <TextField label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="bank_transfer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Effective From" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            <TextField label="Effective To" type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} helpText="Optional — leave blank if ongoing" />
          </div>
          {["hourly_timesheet", "daily_rate"].includes(form.pay_basis ?? "") ? (
            <TextField
              label="Standard Hours Per Day"
              type="number"
              value={standardHours}
              onChange={(e) => setStandardHours(e.target.value)}
              helpText="Used to calculate workdays from timesheet hours"
            />
          ) : null}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">Recurring Components</p>
        <div className="rounded-lg border border-slate-200 p-4 grid gap-3">
          {profileComponents.length === 0 ? (
            <p className="text-sm text-slate-500">No recurring components yet.</p>
          ) : (
            profileComponents.map((pc, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 rounded border border-slate-100 bg-slate-50 p-3">
                <div className="col-span-12 md:col-span-5">
                  <SelectField
                    label="Component"
                    value={pc.component_id}
                    onChange={(e) => {
                      const updated = [...profileComponents];
                      updated[idx] = { ...updated[idx], component_id: e.target.value };
                      setProfileComponents(updated);
                    }}
                  >
                    <option value="">Select component</option>
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </SelectField>
                  {pc.component_id ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {(() => {
                        const c = components.find((x) => x.id === pc.component_id);
                        if (!c) return "";
                        return `${c.component_type.replace("_", " ")} · ${c.calculation_type.replace("_", " ")}`;
                      })()}
                    </p>
                  ) : null}
                </div>
                <div className="col-span-8 md:col-span-6">
                  {(() => {
                    const c = components.find((x) => x.id === pc.component_id);
                    const calcType = c?.calculation_type ?? "fixed";
                    if (calcType === "fixed") {
                      return (
                        <TextField
                          label="Amount"
                          type="number"
                          value={pc.amount}
                          onChange={(e) => {
                            const updated = [...profileComponents];
                            updated[idx] = { ...updated[idx], amount: e.target.value };
                            setProfileComponents(updated);
                          }}
                          placeholder="0.00"
                        />
                      );
                    }
                    if (calcType === "percentage") {
                      return (
                        <TextField
                          label="Rate (%)"
                          type="number"
                          value={pc.rate}
                          onChange={(e) => {
                            const updated = [...profileComponents];
                            updated[idx] = { ...updated[idx], rate: e.target.value };
                            setProfileComponents(updated);
                          }}
                          placeholder="e.g. 10"
                        />
                      );
                    }
                    return (
                      <TextField
                        label="Formula"
                        value={pc.formula}
                        onChange={(e) => {
                          const updated = [...profileComponents];
                          updated[idx] = { ...updated[idx], formula: e.target.value };
                          setProfileComponents(updated);
                        }}
                        placeholder="Optional formula expression"
                      />
                    );
                  })()}
                </div>
                <div className="col-span-4 md:col-span-1 flex items-end justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfileComponents(profileComponents.filter((_, i) => i !== idx))}
                  >
                    <Icon name="delete" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setProfileComponents([...profileComponents, { component_id: "", amount: "", rate: "", formula: "" }])
            }
          >
            <Icon name="add" className="text-[18px]" />
            Add Component
          </Button>
        </div>
      </div>
    ) : null}
  </SlideOverContent>
  <SlideOverFooter>
    <div className="flex w-full items-center justify-between">
      <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
      <div className="flex gap-2">
        {editorStep === "pay" ? (
          <Button variant="secondary" onClick={() => setEditorStep("identity")}>Previous</Button>
        ) : null}
        {editorStep === "identity" ? (
          <Button onClick={() => setEditorStep("pay")}>Next</Button>
        ) : null}
        {editorStep === "pay" ? (
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : editingWorker ? "Update" : "Add Worker"}
          </Button>
        ) : null}
      </div>
    </div>
  </SlideOverFooter>
</SlideOver>
```

Note: The "Save" button only appears on Step 2 (Pay Profile). This ensures users fill identity first.

- [ ] **Step 2: Run PWA typecheck**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx
git commit -m "feat: add 2-step wizard with step indicator to worker editor"
```

---

### Task 4: Wire openEdit population and save logic

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Update `openEdit` to populate pay profile fields**

Change `openEdit` to read from the worker's first profile. After the existing line `setForm({...})`, add:

```typescript
const openEdit = (w: any) => {
  setEditingWorker(w);
  setForm({
    full_name: w.full_name ?? w.name ?? "",
    worker_type: w.worker_type ?? "employee",
    email: w.email ?? "",
    staff_code: w.staff_code ?? "",
    currency: w.currency ?? "NGN",
    status: w.status ?? "active",
    pay_basis: w.pay_basis ?? "monthly_fixed",
    bank_name: w.bank_name ?? "",
    bank_account_name: w.bank_account_name ?? "",
    bank_account_number: w.bank_account_number ?? "",
    tax_identifier: w.tax_identifier ?? "",
    pension_identifier: w.pension_identifier ?? "",
    start_date: w.start_date ?? "",
    end_date: w.end_date ?? "",
  });
  // Populate pay profile from first active profile
  const profile = w.profiles?.[0] || null;
  setBaseAmount(profile?.base_amount != null ? String(profile.base_amount) : "");
  setEffectiveFrom(profile?.effective_from ? String(profile.effective_from).slice(0, 10) : "");
  setEffectiveTo(profile?.effective_to ? String(profile.effective_to).slice(0, 10) : "");
  setPaymentMode(profile?.payment_mode || "bank_transfer");
  setStandardHours(w.standard_hours_per_day != null ? String(w.standard_hours_per_day) : "8");
  setProfileComponents(
    profile?.components?.map((c: any) => ({
      component_id: c.component_id,
      amount: String(c.amount ?? ""),
      rate: c.rate != null ? String(c.rate) : "",
      formula: c.formula || "",
    })) || [],
  );
  setEditorStep("identity");
  setShowSlideOver(true);
  listPayrollComponents().then((r) => setComponents(r.items)).catch(() => {});
};
```

- [ ] **Step 2: Update `handleSave` to construct profile payload**

Change `handleSave` to include the `profile` field in the payload. After the existing `const payload: UpsertWorkerPayload = {...}`, modify the payload construction:

```typescript
const handleSave = async () => {
  if (!form.full_name.trim()) {
    showToast({ tone: "warning", title: "Name required", message: "Please enter the worker's full name." });
    return;
  }
  setSaving(true);
  try {
    const componentRows = profileComponents
      .filter((pc) => pc.component_id)
      .map((pc) => {
        const c = components.find((x) => x.id === pc.component_id);
        const calcType = c?.calculation_type ?? "fixed";
        return {
          component_id: pc.component_id,
          amount: calcType === "fixed" && pc.amount !== "" ? Number(pc.amount) : undefined,
          rate: calcType === "percentage" && pc.rate !== "" ? Number(pc.rate) : undefined,
          formula: calcType === "formula" && pc.formula?.trim() ? pc.formula.trim() : undefined,
        };
      })
      .filter((pc) => pc.amount !== undefined || pc.rate !== undefined || pc.formula);

    const hasProfileFields = baseAmount || effectiveFrom || componentRows.length > 0;

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
              base_amount: baseAmount ? Number(baseAmount) : 0,
              payment_mode: paymentMode,
              pay_frequency: "monthly",
              ...(componentRows.length > 0 ? { components: componentRows } : {}),
            },
          }
        : {}),
    };
    if (editingWorker) {
      await updatePayrollWorker(String((editingWorker as any).id), payload);
      showToast({ tone: "success", title: "Updated", message: `${form.full_name} updated successfully.` });
    } else {
      await createPayrollWorker(payload);
      showToast({ tone: "success", title: "Created", message: `${form.full_name} added as a payroll worker.` });
    }
    setShowSlideOver(false);
    setListKey((k) => k + 1);
  } catch (err) {
    showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save worker." });
  } finally {
    setSaving(false);
  }
};
```

Also update `EMPTY_FORM` to remove `profile_id?: string`:

```typescript
const EMPTY_FORM: UpsertWorkerPayload = {
  full_name: "",
  worker_type: "employee",
  email: "",
  staff_code: "",
  currency: "NGN",
  status: "active",
  pay_basis: "monthly_fixed",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  tax_identifier: "",
  pension_identifier: "",
  start_date: "",
};
```

- [ ] **Step 3: Run PWA typecheck**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

Expected: no errors

- [ ] **Step 4: Build to verify**

```bash
npm run build --workspace=apps/pwa 2>&1 | tail -5
```

Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: wire pay profile save logic and edit population"
```
