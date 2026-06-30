# Payroll Worker Pay Profile — Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add statutory override controls as Step 4 of the worker wizard.

**Architecture:** No backend changes. Add `tax_table_id` and `metadata` to `UpsertWorkerPayload`. Add Step 4 to wizard. Wire edit/save.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing PWA component library.

---

### Task 1: Add `tax_table_id` and `metadata` to `UpsertWorkerPayload`

**Files:**
- Modify: `apps/pwa/src/shared/api/payroll-api.ts`

- [ ] **Step 1: Add fields**

Find `UpsertWorkerPayload` in `payroll-api.ts`. Add these after `allocation_mode?: string;`:

```typescript
  tax_table_id?: string;
  metadata?: Record<string, unknown>;
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: add tax_table_id and metadata to UpsertWorkerPayload"
```

---

### Task 2: Add Step 4 — Statutory Overrides UI + wiring

**Files:**
- Modify: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Add state variables**

After the existing allocation state variables, add:

```typescript
const [applyTax, setApplyTax] = useState(true);
const [applyPension, setApplyPension] = useState(true);
const [employerCoversPaye, setEmployerCoversPaye] = useState(false);
const [taxTableId, setTaxTableId] = useState("");
const [taxTables, setTaxTables] = useState<PayrollComponent[]>([]);
const [pensionRate, setPensionRate] = useState("");
const [withholdingRate, setWithholdingRate] = useState("");
const [consultantPensionRate, setConsultantPensionRate] = useState("");
```

- [ ] **Step 2: Change `editorStep` type to include "compliance"**

Find:
```typescript
const [editorStep, setEditorStep] = useState<"identity" | "pay" | "allocation">("identity");
```

Change to:
```typescript
const [editorStep, setEditorStep] = useState<"identity" | "pay" | "allocation" | "compliance">("identity");
```

- [ ] **Step 3: Update `openCreate` to reset compliance state and fetch tax tables**

In `openCreate`, after the existing `setAllocations(...)` reset line and before `setShowSlideOver(true)`, add:

```typescript
  setApplyTax(true);
  setApplyPension(true);
  setEmployerCoversPaye(false);
  setTaxTableId("");
  setPensionRate("");
  setWithholdingRate("");
  setConsultantPensionRate("");
```

After the existing `Promise.allSettled(...)` block, add:

```typescript
  listPayrollTaxTables().then((r) => setTaxTables(r.items)).catch(() => {});
```

- [ ] **Step 4: Update the step indicator and footer navigation**

The step indicator array currently has 3 items. Change from:

```typescript
{[{ id: "identity" as const, label: "Identity" }, { id: "pay" as const, label: "Pay Profile" }, { id: "allocation" as const, label: "Allocation" }].map((s, i) => (
```

To:

```typescript
{[{ id: "identity" as const, label: "Identity" }, { id: "pay" as const, label: "Pay Profile" }, { id: "allocation" as const, label: "Allocation" }, { id: "compliance" as const, label: "Compliance" }].map((s, i) => (
```

Update the footer navigation logic. Currently it uses `editorStep === "allocation"` to show Save. Change to `editorStep === "compliance"`:

```tsx
        <SlideOverFooter>
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
            <div className="flex gap-2">
              {editorStep !== "identity" ? (
                <Button variant="secondary" onClick={() => setEditorStep(
                  editorStep === "pay" ? "identity" : editorStep === "allocation" ? "pay" : "allocation"
                )}>Previous</Button>
              ) : null}
              {editorStep !== "compliance" ? (
                <Button onClick={() => setEditorStep(
                  editorStep === "identity" ? "pay" : editorStep === "pay" ? "allocation" : "compliance"
                )}>Next</Button>
              ) : null}
              {editorStep === "compliance" ? (
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Saving..." : editingWorker ? "Update" : "Add Worker"}
                </Button>
              ) : null}
            </div>
          </div>
        </SlideOverFooter>
```

- [ ] **Step 5: Add Step 4 — Compliance JSX**

After the Step 3 (Allocation) block and before `</SlideOverContent>`, add:

```tsx
          {/* Step 4: Compliance */}
          {editorStep === "compliance" ? (
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statutory Overrides</p>
              <p className="text-xs text-slate-500">Only change these when a worker should not use the global payroll settings.</p>
              <div className="rounded-lg border border-slate-200 p-4 grid gap-4">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />
                    Apply Tax
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={applyPension} onChange={(e) => setApplyPension(e.target.checked)} />
                    Apply Pension
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={employerCoversPaye} onChange={(e) => setEmployerCoversPaye(e.target.checked)} />
                    Employer Covers PAYE
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="PAYE Tax Table Override" value={taxTableId} onChange={(e) => setTaxTableId(e.target.value)}>
                    <option value="">Use payroll default</option>
                    {taxTables.filter((t: any) => ["employee", "all"].includes(t.worker_type ?? "employee")).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </SelectField>
                  <TextField label="Pension Rate Override" type="number" value={pensionRate} onChange={(e) => setPensionRate(e.target.value)} placeholder="e.g. 0.08" />
                </div>
                {(form.worker_type ?? "employee") === "consultant" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Withholding Rate Override" type="number" value={withholdingRate} onChange={(e) => setWithholdingRate(e.target.value)} placeholder="e.g. 0.05" />
                    <TextField label="Consultant Pension Override" type="number" value={consultantPensionRate} onChange={(e) => setConsultantPensionRate(e.target.value)} placeholder="e.g. 0.00" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
```

- [ ] **Step 6: Update `openEdit` to populate compliance fields**

In `openEdit`, after the allocation population block and before `setEditorStep("identity")`, add:

```typescript
    setApplyTax(w.metadata?.apply_tax !== false);
    setApplyPension(w.metadata?.apply_pension !== false);
    setEmployerCoversPaye(w.metadata?.employer_covers_paye === true);
    setTaxTableId(w.tax_table_id || "");
    setPensionRate(w.metadata?.pension_rate != null ? String(w.metadata.pension_rate) : "");
    setWithholdingRate(w.metadata?.withholding_rate != null ? String(w.metadata.withholding_rate) : "");
    setConsultantPensionRate(w.metadata?.consultant_pension_rate != null ? String(w.metadata.consultant_pension_rate) : "");
```

Also in `openEdit`, after the existing fetch promises, add:

```typescript
  listPayrollTaxTables().then((r) => setTaxTables(r.items)).catch(() => {});
```

- [ ] **Step 7: Update `handleSave` to include compliance fields**

In `handleSave`, after the allocation fields in the payload, add:

```typescript
        tax_table_id: taxTableId || undefined,
        metadata: {
          apply_tax: applyTax,
          apply_pension: applyPension,
          employer_covers_paye: employerCoversPaye,
          ...(pensionRate ? { pension_rate: Number(pensionRate) } : {}),
          ...(withholdingRate ? { withholding_rate: Number(withholdingRate) } : {}),
          ...(consultantPensionRate ? { consultant_pension_rate: Number(consultantPensionRate) } : {}),
        },
```

- [ ] **Step 8: Verify**

```bash
npx tsc --noEmit --project apps/pwa/tsconfig.json
npm run build --workspace=apps/pwa 2>&1 | tail -5
```

Expected: no errors, build succeeds

- [ ] **Step 9: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat: add Step 4 statutory overrides with checkboxes, rate inputs, and tax table selector"
```
