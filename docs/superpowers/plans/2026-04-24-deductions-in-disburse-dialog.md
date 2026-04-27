# Deductions in DisburseDialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional Payee/Vendor dropdown and a collapsible Statutory Deductions section to the DisburseDialog, applying deductions atomically after PV creation in a two-step client-side flow.

**Architecture:** Backend gains `contact_id` on `DisburseRequestDto` (saved to `contactId` on the PV) and returns the new `voucher.id` in the disburse response. The frontend adds `DeductionLine[]` state and `contact_id` to the disburse context, updates `handleWorkflowAction` to capture the PV ID and call `applyPVDeductions` when lines exist, and extends `DisburseDialog` with the two new UI sections.

**Tech Stack:** NestJS + Prisma (API), React 18 + TypeScript + Tailwind (PWA), `useCachedQuery` + `financeApi` from `@stanforte/shared`.

---

## File Map

| File | Change |
|------|--------|
| `api/src/modules/finance/dto/disburse-request.dto.ts` | Add `contact_id?: string` |
| `api/src/modules/finance/finance.service.ts` | Save `contactId` on PV; return `voucher.id` |
| `apps/pwa/src/features/requests/requests-api.ts` | Add `contact_id` to payload; update return type |
| `apps/pwa/src/modules/finance/finance-request-details/context.ts` | New `DeductionLine` type; `contact_id` on `DisburseForm`; context additions |
| `apps/pwa/src/modules/finance/finance-request-details/index.tsx` | New state; updated `closeDisburseDialog`; updated `handleWorkflowAction` |
| `apps/pwa/src/modules/finance/finance-request-details/components/modals/DisburseDialog.tsx` | Payee dropdown + Deductions collapsible section |

---

## Task 1: Backend DTO — add `contact_id`

**Files:**
- Modify: `api/src/modules/finance/dto/disburse-request.dto.ts`

- [ ] **Step 1: Add `contact_id` field to `DisburseRequestDto`**

Open `api/src/modules/finance/dto/disburse-request.dto.ts`. Add the new field after `disbursed_at`:

```typescript
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DisburseRequestDto {
  @ApiPropertyOptional({ example: 'Approved and transferred to requester account.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'bank_transfer' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: 'STN240217001' })
  @IsOptional()
  @IsString()
  transaction_ref?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 'f3e8b369-0eca-454f-a8f8-46b780bc6264' })
  @IsOptional()
  @IsUUID()
  evidence_file_id?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidence_file_ids?: string[];

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  paid_from_account_id?: string;

  @ApiPropertyOptional({ example: '2026-04-09T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  disbursed_at?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Vendor/payee contact ID' })
  @IsOptional()
  @IsUUID()
  contact_id?: string;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api && npx tsc -p tsconfig.build.json --noEmit 2>&1 | head -20
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/dto/disburse-request.dto.ts
git commit -m "feat(finance): add contact_id to DisburseRequestDto"
```

---

## Task 2: Backend Service — save `contactId` on PV and return voucher ID

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts` (lines ~522–536 and ~656–664)

- [ ] **Step 1: Add `contactId` to the PV create call**

In `finance.service.ts`, find the `financePaymentVoucher.create()` call inside `disburseRequest` (around line 522). Add `contactId` to the data object:

```typescript
const voucher = await this.prisma.financePaymentVoucher.create({
  data: {
    requestId: id,
    paidFromAccountId: dto.paid_from_account_id ?? null,
    fundId: fund?.id ?? null,
    grantId: grant?.id ?? null,
    voucherNumber,
    amount: disburseAmount,
    method: dto.method ?? null,
    transactionRef: dto.transaction_ref ?? null,
    note: dto.note ?? null,
    evidenceFileId: evidenceFileIds[0] ?? null,
    disbursedAt: now,
    contactId: dto.contact_id ?? null,   // ← add this line
  }
});
```

- [ ] **Step 2: Include `voucher.id` in the return value**

Find the `return { id: updated.id.toString(), ... }` block (around line 656). Add `voucher`:

```typescript
return {
  id: updated.id.toString(),
  status: updated.status,
  total_amount: updated.totalAmount !== null ? Number(updated.totalAmount) : 0,
  currency: updated.currency,
  created_at: updated.createdAt.toISOString(),
  updated_at: updated.updatedAt.toISOString(),
  data: updated.data,
  voucher: { id: voucher.id },   // ← add this line
};
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api && npx tsc -p tsconfig.build.json --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/finance/finance.service.ts
git commit -m "feat(finance): save contactId on PV and return voucher id from disburseRequest"
```

---

## Task 3: Frontend API — update `disburseRequest` signature and return type

**Files:**
- Modify: `apps/pwa/src/features/requests/requests-api.ts` (lines ~302–323)

- [ ] **Step 1: Add `contact_id` to payload and update return type**

Replace the `disburseRequest` function (lines 302–323):

```typescript
type DisburseResult = {
  id: string;
  status: string;
  voucher?: { id: string };
};

export async function disburseRequest(
  id: string,
  payload?: {
    note?: string;
    amount?: number;
    method?: string;
    transaction_ref?: string;
    evidence_file_id?: string;
    evidence_file_ids?: string[];
    paid_from_account_id?: string;
    disbursed_at?: string;
    contact_id?: string;
  },
  options?: {
    traceId?: string;
  }
) {
  return httpRequest<DisburseResult>(`/finance/requests/${id}/disburse`, {
    method: "POST",
    body: payload ?? {},
    headers: options?.traceId ? { "x-trace-id": options.traceId } : undefined,
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "requests-api" | head -10
```

Expected: no errors on `requests-api.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/features/requests/requests-api.ts
git commit -m "feat(finance): add contact_id to disburseRequest payload and typed return"
```

---

## Task 4: Context — `DeductionLine` type, `contact_id` in `DisburseForm`, context additions

**Files:**
- Modify: `apps/pwa/src/modules/finance/finance-request-details/context.ts`

- [ ] **Step 1: Add `DeductionLine` export, extend `DisburseForm`, extend context type**

Replace the entire `context.ts` with the following (only the changed parts are described; write the full file):

After the import block, add:

```typescript
export type DeductionLine = {
  deduction_type_id: string;
  rate: number;
  gross_amount: number;
  deduction_amount: number;
};
```

Add `contact_id: string` to `DisburseForm`:

```typescript
export type DisburseForm = {
  amount: string;
  method: string;
  transaction_ref: string;
  paid_from_account_id: string;
  note: string;
  disbursed_at: string;
  contact_id: string;
};
```

Add `contact_id: ""` to `initialDisburseForm`:

```typescript
export const initialDisburseForm: DisburseForm = {
  amount: "",
  method: "bank_transfer",
  transaction_ref: "",
  paid_from_account_id: "",
  note: "",
  disbursed_at: new Date().toISOString().slice(0, 10),
  contact_id: "",
};
```

Add two entries to `RequestDetailsContextValue` (after `setDisburseFiles`):

```typescript
disburseDeductions: DeductionLine[];
setDisburseDeductions: React.Dispatch<React.SetStateAction<DeductionLine[]>>;
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "context.ts" | head -10
```

Expected: no errors on `context.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/finance/finance-request-details/context.ts
git commit -m "feat(finance): add DeductionLine type and disburseDeductions to DisburseDialog context"
```

---

## Task 5: index.tsx — wire state, submit flow, reset

**Files:**
- Modify: `apps/pwa/src/modules/finance/finance-request-details/index.tsx`

- [ ] **Step 1: Import `DeductionLine` from context**

Find the import from `"./context"` (near the top of the file). Add `DeductionLine` to it:

```typescript
import {
  RequestDetailsContext,
  initialDisburseForm,
  initialRetireForm,
  type DisburseForm,
  type RetireForm,
  type DeductionLine,          // ← add
} from "./context";
```

- [ ] **Step 2: Add `disburseDeductions` state**

After line 84 (`const [disburseFiles, setDisburseFiles] = useState...`), add:

```typescript
const [disburseDeductions, setDisburseDeductions] = useState<DeductionLine[]>([]);
```

- [ ] **Step 3: Reset `disburseDeductions` in `closeDisburseDialog`**

The current `closeDisburseDialog` function (line 759) is:

```typescript
function closeDisburseDialog() {
  setShowDisburseDialog(false);
  setDisburseMode("create");
  setEditingVoucherId("");
}
```

Replace with:

```typescript
function closeDisburseDialog() {
  setShowDisburseDialog(false);
  setDisburseMode("create");
  setEditingVoucherId("");
  setDisburseDeductions([]);
}
```

- [ ] **Step 4: Update the disburse branch in `handleWorkflowAction`**

Find the `} else if (action === "disburse") {` block (line 859). Replace the entire block:

```typescript
} else if (action === "disburse") {
  const traceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const disbursePayload = {
    amount: Number(disburseForm.amount || request?.total_amount || 0),
    method: disburseForm.method || undefined,
    transaction_ref: disburseForm.transaction_ref.trim() || undefined,
    paid_from_account_id: disburseForm.paid_from_account_id || undefined,
    note: disburseForm.note.trim() || undefined,
    disbursed_at: disburseForm.disbursed_at
      ? `${disburseForm.disbursed_at}T00:00:00.000Z`
      : undefined,
    evidence_file_id: disburseFiles[0]?.id,
    evidence_file_ids: disburseFiles.map((file) => file.id),
    contact_id: disburseForm.contact_id || undefined,
  };
  if (disburseMode === "edit" && editingVoucherId) {
    await financeApi.updatePaymentVoucher(
      id,
      editingVoucherId,
      disbursePayload,
    );
  } else {
    const result = await disburseRequest(id, disbursePayload, { traceId });
    if (disburseDeductions.length > 0 && result?.voucher?.id) {
      try {
        await financeApi.applyPVDeductions(result.voucher.id, {
          deductions: disburseDeductions,
        });
      } catch {
        showToast({
          tone: "warning",
          title: "Deductions not saved",
          message:
            "Disbursement recorded but deductions could not be saved — apply them from Finance > Payment Vouchers.",
        });
      }
    }
  }
```

- [ ] **Step 5: Expose `disburseDeductions` and `setDisburseDeductions` in context value**

Find the `contextValue` object (around line 1096 where `setDisburseFiles` is listed). Add after it:

```typescript
disburseDeductions,
setDisburseDeductions,
```

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "index.tsx\|finance-request-details" | head -15
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/modules/finance/finance-request-details/index.tsx
git commit -m "feat(finance): wire disburseDeductions state and two-step deduction apply in handleWorkflowAction"
```

---

## Task 6: DisburseDialog — Payee dropdown + Deductions section

**Files:**
- Modify: `apps/pwa/src/modules/finance/finance-request-details/components/modals/DisburseDialog.tsx`

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `DisburseDialog.tsx`:

```typescript
import { useState } from "react";
import {
  Button,
  Icon,
  MediaPickerModal,
  SelectField,
  TextAreaField,
  TextField,
} from "@/shared";
import { listFileAssets, uploadFileAsset } from "@/features/files/files-api";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import { useRequestDetails } from "../../context";
import type { DeductionLine } from "../../context";
```

- [ ] **Step 2: Update context destructuring and add local state + data fetching**

Replace the start of the `DisburseDialog` function body (everything up to the `return` statement) with:

```typescript
export function DisburseDialog() {
  const {
    request,
    requestData,
    disburseMode,
    disburseForm,
    setDisburseForm,
    disburseFiles,
    setDisburseFiles,
    disburseDeductions,
    setDisburseDeductions,
    financeAccounts,
    actionBusy,
    financeProgress,
    showDisbursementMediaPicker,
    setShowDisbursementMediaPicker,
    closeDisburseDialog,
    handleWorkflowAction,
    currentUserId,
  } = useRequestDetails();

  const [deductionsOpen, setDeductionsOpen] = useState(false);
  const [grossAmount, setGrossAmount] = useState(disburseForm.amount);

  const { data: contactsData } = useCachedQuery(
    "finance:contacts:vendors",
    () => financeApi.listContacts({ contact_type: "vendor", per_page: 200 }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const vendors: any[] = Array.isArray((contactsData as any)?.result)
    ? (contactsData as any).result
    : Array.isArray(contactsData)
      ? contactsData
      : [];

  const { data: deductionTypesData } = useCachedQuery(
    "finance:deduction-types:active",
    () => financeApi.listDeductionTypes({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );
  const deductionTypes: any[] = Array.isArray(deductionTypesData)
    ? deductionTypesData
    : [];

  function syncGross(value: string) {
    setGrossAmount(value);
    setDisburseDeductions((prev) =>
      prev.map((line) => ({
        ...line,
        gross_amount: Number(value) || 0,
        deduction_amount:
          Math.round((Number(value) || 0) * line.rate * 100) / 100,
      })),
    );
  }

  function addLine() {
    setDisburseDeductions((prev) => [
      ...prev,
      {
        deduction_type_id: "",
        rate: 0,
        gross_amount: Number(grossAmount) || 0,
        deduction_amount: 0,
      },
    ]);
  }

  function removeLine(index: number) {
    setDisburseDeductions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(
    index: number,
    field: keyof DeductionLine,
    value: string | number,
  ) {
    setDisburseDeductions((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        if (field === "deduction_type_id") {
          const type = deductionTypes.find((t: any) => t.id === value);
          if (type) {
            updated.rate = Number(type.rate);
            updated.deduction_amount =
              Math.round(
                (Number(grossAmount) || 0) * Number(type.rate) * 100,
              ) / 100;
          }
        }
        if (field === "rate") {
          updated.deduction_amount =
            Math.round((Number(grossAmount) || 0) * Number(value) * 100) / 100;
        }
        return updated;
      }),
    );
  }

  const totalDeducted = disburseDeductions.reduce(
    (s, l) => s + l.deduction_amount,
    0,
  );
  const netPayable = (Number(grossAmount) || 0) - totalDeducted;
```

- [ ] **Step 3: Add Payee dropdown and Deductions section to JSX**

Inside the `<div className="flex-1 overflow-y-auto px-6 py-5">` block, after the closing `</div>` of the 2-column grid and after the `<div className="mt-4">` Disbursement Note textarea (before the Evidence Upload section), insert:

```tsx
            {/* Payee / Vendor */}
            <div className="mt-4">
              <SelectField
                label="Payee / Vendor"
                value={disburseForm.contact_id}
                onChange={(e) =>
                  setDisburseForm((f) => ({
                    ...f,
                    contact_id: e.target.value,
                  }))
                }
              >
                <option value="">— None (not a vendor payment) —</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.company_name ? ` — ${v.company_name}` : ""}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Statutory Deductions */}
            <div className="mt-4 rounded-[22px] border border-slate-200">
              <button
                type="button"
                onClick={() => setDeductionsOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-[22px] transition"
              >
                <span className="flex items-center gap-2">
                  Statutory Deductions
                  {disburseDeductions.length > 0 && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-900">
                      {disburseDeductions.length}
                    </span>
                  )}
                </span>
                <Icon
                  name={deductionsOpen ? "expand_less" : "expand_more"}
                  className="text-slate-400"
                />
              </button>

              {deductionsOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
                  {/* Gross Amount */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Gross Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                      value={grossAmount}
                      onChange={(e) => syncGross(e.target.value)}
                      placeholder={disburseForm.amount || "Enter gross amount"}
                    />
                  </div>

                  {/* Deduction lines */}
                  <div className="space-y-3">
                    {disburseDeductions.map((line, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">
                            Line {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLine(i)}
                            className="text-xs text-danger hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">
                              Deduction Type
                            </label>
                            <select
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                              value={line.deduction_type_id}
                              onChange={(e) =>
                                updateLine(
                                  i,
                                  "deduction_type_id",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="">Select type</option>
                              {deductionTypes.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({(Number(t.rate) * 100).toFixed(1)}
                                  %)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">
                              Rate (decimal)
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              max="1"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                              value={line.rate}
                              onChange={(e) =>
                                updateLine(i, "rate", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-slate-500">
                            Deduction Amount
                          </span>
                          <span className="font-semibold text-danger">
                            {formatCurrency(line.deduction_amount, "NGN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm font-semibold text-brand-900 hover:underline"
                  >
                    + Add deduction
                  </button>

                  {disburseDeductions.length > 0 && (
                    <div className="rounded-xl bg-slate-100 px-4 py-3 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Gross</span>
                        <span>
                          {formatCurrency(Number(grossAmount) || 0, "NGN")}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium text-danger">
                        <span>Total Deductions</span>
                        <span>− {formatCurrency(totalDeducted, "NGN")}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                        <span>Net Payable</span>
                        <span>{formatCurrency(netPayable, "NGN")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "DisburseDialog\|context.ts\|index.tsx" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/modules/finance/finance-request-details/components/modals/DisburseDialog.tsx
git commit -m "feat(finance): add Payee dropdown and Statutory Deductions section to DisburseDialog"
```

---

## Manual Verification Checklist

After all tasks are complete:

- [ ] Open a disbursable request → click **Disburse**
- [ ] Verify **Payee / Vendor** dropdown appears and lists contacts with `contact_type = vendor`
- [ ] Verify **Statutory Deductions** section is collapsed by default with a chevron toggle
- [ ] Expand it → enter a Gross Amount → click **+ Add deduction** → select a type → confirm Rate auto-fills and Deduction Amount calculates
- [ ] Verify Net Payable summary row appears with correct math
- [ ] Click **Confirm Disbursement** → verify PV is created (check Finance > Payment Vouchers)
- [ ] If deductions were added, verify they appear on the PV in Finance > Payment Vouchers
- [ ] If no vendor selected and deductions are added, verify PV is created with deductions (no accruals)
- [ ] If deduction apply call fails, verify warning toast appears without rolling back the disbursement
- [ ] Open the dialog again → verify deduction lines are cleared (reset on close)
