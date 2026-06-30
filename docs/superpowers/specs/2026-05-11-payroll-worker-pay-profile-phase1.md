# Payroll Worker Pay Profile — Phase 1

## Summary

Add base amount, effective dates, and recurring salary components to the HR payroll worker editor in the new PWA. This unblocks zero-amount payroll runs by allowing HR to set what each worker earns and which components (allowances, deductions) apply.

## Scope

Phase 1 only: base amount + effective dates + profile components. Allocations and statutory overrides are deferred to Phases 2 and 3.

## Architecture

- **No API changes needed** — backend `UpsertPayrollWorkerDto` already supports nested `profile` with `base_amount`, `effective_from`, `components[]`
- **Frontend only**: augment the existing single-page slideover in `HrPayrollWorkersPage.tsx` into a 2-step wizard
- **Shared API**: expand `UpsertWorkerPayload` type in `payroll-api.ts` with `profile` field

## Step Structure

### Step 1: Identity
Keeps all existing fields — name, worker type, email, staff code, pay basis, currency, status, start/end dates, bank details, tax/pension IDs. Add a step indicator at top.

### Step 2: Pay Profile

| Field | Type | Notes |
|-------|------|-------|
| Base Amount | number | Label changes based on pay_basis |
| Effective From | date | Required |
| Effective To | date | Optional |
| Payment Mode | select | bank_transfer / cash |
| Standard Hrs/Day | number | Default 8 |

#### Recurring Components
- Fetch component list via existing `listPayrollComponents()`
- "Add Component" button appends empty row
- Each row: component selector, type-aware amount/rate/formula input, delete button
- Empty state: "No recurring components yet."

## Data Mapping

### Opening for edit
Populate from `worker.profiles[0]` (latest active profile):
- `base_amount`, `effective_from`, `effective_to`, `payment_mode`, `standard_hours_per_day`
- `profile_components`: map `profiles[0].components` to `{ component_id, amount, rate, formula }`

### Save
Construct `profile` payload only when base amount, effective from, or components have values. Filter out components with no amount/rate/formula set.

### Edge Cases
- New worker with no profile → omit `profile` from payload
- Clearing all profile fields on edit → sends `base_amount: 0`
- Component with no amount, rate, or formula → filtered client-side

## File Changes

- `apps/pwa/src/shared/api/payroll-api.ts` — expand `UpsertWorkerPayload` type
- `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx` — add step indicator, step 2 UI, save logic for profile
