# Deductions in DisburseDialog

**Date:** 2026-04-24
**Status:** Approved

## Goal

Move statutory deduction entry (WHT, VAT, levies) into the DisburseDialog so finance officers can capture payee and applicable deductions at the moment of disbursement rather than as a separate post-disbursement step in Finance > Payment Vouchers.

## Background

The existing WHT implementation places deduction management on `FinancePaymentVouchersPage` via `PVDeductionsPanel`. The UX gap: deductions must be applied in a second workflow after disbursement. Finance officers expect to see gross → deductions → net payable at the point of disbursement, especially for vendor payments.

The `applyPVDeductions` API requires an existing PV ID, so deductions cannot be submitted before the PV is created. The solution is a two-step client-side flow: create PV → apply deductions, both triggered by a single user action.

## Approach

**Option C (selected):** Two-step client-side with optional contact/payee picker.

- Frontend adds deduction lines and an optional vendor field to the DisburseDialog
- On submit: `disburseRequest` creates the PV → frontend immediately calls `applyPVDeductions` with the new PV ID if any lines were entered
- No new backend endpoint; only a small DTO addition and one service-layer field mapping

## Design

### UI — DisburseDialog

Two new optional sections inserted between "Disbursement Note" and "Evidence Upload":

**Payee / Vendor** (optional dropdown)
- Loads `listContacts({ contact_type: 'vendor' })` via `financeApi`
- Rendered as a searchable select: `{contact.name} — {contact.companyName}`
- Empty value = "— None (not a vendor payment) —"
- Selecting a contact links the PV's `contactId`, enabling WHT accrual tracking

**Statutory Deductions** (collapsible, collapsed by default)
- Toggle header: "Statutory Deductions" with a chevron icon and an optional badge showing line count when expanded
- When expanded:
  - **Gross Amount** field — auto-synced from the Amount field, independently editable
  - **Deduction lines** — each line has:
    - Deduction Type dropdown (from `listDeductionTypes({ is_active: true })`)
    - Rate field (decimal, auto-filled from selected type, editable)
    - Calculated Deduction Amount (read-only, `gross × rate`)
    - Remove button
  - **"+ Add deduction"** button
  - **Summary row** (visible when ≥ 1 line): Gross / − Total Deductions / **Net Payable**

The section is always visible regardless of request type or whether a vendor is selected. Deductions without a linked contact are saved on the PV but do not generate `FinanceVendorWHTAccrual` records.

### State & Context

**`DisburseForm`** (`context.ts`) gains:
```ts
contact_id: string;   // empty string = none selected
```
`initialDisburseForm` updated to include `contact_id: ""`.

**New state in `index.tsx`** (not part of `DisburseForm`):
```ts
const [disburseDeductions, setDisburseDeductions] = useState<DeductionLine[]>([]);
```
Where `DeductionLine = { deduction_type_id: string; rate: number; gross_amount: number; deduction_amount: number }`.

This type is extracted to a shared location (e.g. `finance-request-details/types.ts` or re-exported from `PVDeductionsPanel`) so both files use the same definition.

**`RequestDetailsContextValue`** gains:
```ts
disburseDeductions: DeductionLine[];
setDisburseDeductions: React.Dispatch<React.SetStateAction<DeductionLine[]>>;
```

**`closeDisburseDialog()`** resets `disburseDeductions` to `[]` and `disburseForm.contact_id` to `""`.

### Submit Flow (`handleWorkflowAction("disburse")`)

```
1. Build disbursePayload — include contact_id if set
2. call disburseRequest(id, disbursePayload)  →  newPv
3. if disburseDeductions.length > 0:
     try:
       await financeApi.applyPVDeductions(newPv.id, { deductions: disburseDeductions })
     catch:
       showToast warning: "Disbursement recorded but deductions could not be saved —
                           apply them from Finance > Payment Vouchers"
       (do NOT rollback the PV — graceful degradation)
4. Close dialog, refresh page
```

Edit mode (`disburseMode === "edit"`) skips step 3 entirely. Deductions on existing PVs are managed from Finance > Payment Vouchers.

### Backend Changes

**`api/src/modules/finance/dto/disburse-request.dto.ts`**
Add one field:
```ts
@ApiPropertyOptional()
@IsOptional()
@IsUUID()
contact_id?: string;
```

**`api/src/modules/finance/finance.service.ts` — `disburseRequest` method**
Map `dto.contact_id` to `contactId` in the Prisma `financePaymentVoucher.create()` call. Field already exists on the model from the zoho contact entity migration.

No new migration, no schema change, no new endpoint.

## Files Affected

| File | Change |
|------|--------|
| `api/src/modules/finance/dto/disburse-request.dto.ts` | Add `contact_id` field |
| `api/src/modules/finance/finance.service.ts` | Map `contact_id` → `contactId` on PV create |
| `apps/pwa/src/modules/finance/finance-request-details/context.ts` | Add `contact_id` to `DisburseForm`; add `disburseDeductions` + setter to context type |
| `apps/pwa/src/modules/finance/finance-request-details/index.tsx` | Add `disburseDeductions` state; update `handleWorkflowAction`; reset in `closeDisburseDialog` |
| `apps/pwa/src/modules/finance/finance-request-details/components/modals/DisburseDialog.tsx` | Add Payee dropdown + Deductions collapsible section |

## Out of Scope

- Auto-populating deduction lines based on the selected vendor's history
- Deduction validation that blocks disbursement (deductions are always optional)
- Changes to `PVDeductionsPanel` (remains available for post-hoc edits)
- Edit mode deduction management (handled in Finance > Payment Vouchers)
