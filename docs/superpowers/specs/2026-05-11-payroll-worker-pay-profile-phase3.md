# Payroll Worker Pay Profile — Phase 3: Statutory Overrides

## Summary

Add statutory override controls (tax/pension toggles, rate overrides, tax table override, employer PAYE cover) as Step 4 of the worker wizard.

## Scope

Phase 3 only: statutory overrides. No API changes needed.

## Architecture

- **Backend**: `UpsertPayrollWorkerDto` already supports `tax_table_id` and `metadata` (JSON object)
- **Frontend**: Add Step 4 to the existing 3-step wizard. Extend `UpsertWorkerPayload` with `tax_table_id` and `metadata`
- **Existing API**: `listPayrollTaxTables()` available from `payroll-api.ts`

## Step 4 Fields

| Field | Type | Default | Stored As |
|---|---|---|---|
| Apply Tax | checkbox | true | `metadata.apply_tax` |
| Apply Pension | checkbox | true | `metadata.apply_pension` |
| Employer Covers PAYE | checkbox | false | `metadata.employer_covers_paye` |
| Tax Table Override | select (from tax tables) | "" | `tax_table_id` |
| Pension Rate Override | number | "" | `metadata.pension_rate` |
| Withholding Rate Override | number (consultant only) | "" | `metadata.withholding_rate` |
| Consultant Pension Rate Override | number (consultant only) | "" | `metadata.consultant_pension_rate` |

## Data Mapping

### Opening for edit
- `applyTax` ← `worker.metadata?.apply_tax !== false`
- `applyPension` ← `worker.metadata?.apply_pension !== false`
- `employerCoversPaye` ← `worker.metadata?.employer_covers_paye === true`
- `taxTableId` ← `worker.tax_table_id ?? ""`
- `pensionRate` ← `worker.metadata?.pension_rate ?? ""`
- `withholdingRate` ← `worker.metadata?.withholding_rate ?? ""`
- `consultantPensionRate` ← `worker.metadata?.consultant_pension_rate ?? ""`

### Save
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

## File Changes

- `apps/pwa/src/shared/api/payroll-api.ts` — add `tax_table_id` and `metadata` to `UpsertWorkerPayload`
- `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx` — add Step 4 UI, extend wizard to 4 steps, extend save logic, extend edit population
