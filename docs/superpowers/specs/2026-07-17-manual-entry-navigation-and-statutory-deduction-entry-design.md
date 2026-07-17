# Manual Entry Navigation And Statutory Deduction Entry Design

## Summary

Reorganize finance navigation so manual-entry workflows live in a dedicated `Manual Entries` menu, move the existing journal-entry page into that menu, add a new `Statutory Deduction Entry` page beside it, and harden Prisma bootstrap behavior for production.

## Goals

- Move the current `Journal Entry` page out of `Finance > Accounting` into its own dedicated finance submenu.
- Add a new manual-entry page specifically for statutory deduction entries.
- Keep the existing `Statutory Deductions` page focused on tracking and remittance, not entry creation.
- Reduce avoidable production Prisma failures during startup and shutdown.

## Non-Goals

- Rebuild the existing statutory deductions register/remittance workflow.
- Redesign the full finance information architecture outside the affected menu items.
- Introduce broad Prisma infrastructure changes such as read replicas, Accelerate, or retry frameworks.

## Current State

- `apps/pwa/src/shared/navigation.ts` places `Journal Entry` under `Finance > Accounting` and `Statutory Deductions` under `Finance > Workflows`.
- `apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx` provides a generic manual journal form backed by `GET/POST /finance/manual-entry`.
- `apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx` is a deductions register for searching, selecting, remitting, and downloading TRM slips.
- `api/src/modules/finance/finance.service.ts` stores generic manual entries with `sourceType: 'manual_entry'`.
- `api/src/common/prisma/prisma.service.ts` currently only calls `$connect()` and `$disconnect()` with no environment-aware logging or defensive lifecycle handling.

## Approved UX Direction

### Navigation

Create a new `Finance > Manual Entries` submenu with:

- `Journal Entry` -> existing route `/finance/manual-entry`
- `Statutory Deduction Entry` -> new route `/finance/manual-entry/statutory-deductions`

Remove `Journal Entry` from `Finance > Accounting`.

Keep `Statutory Deductions` in `Finance > Workflows` because it is an operational register/remittance surface, not a manual-entry form.

### Journal Entry Page

The existing page stays functionally generic but changes active navigation context to the new submenu.

### Statutory Deduction Entry Page

Create a sibling page that mirrors the existing manual-entry page structure but is tailored to statutory deductions.

The page should include:

- entry date
- currency
- memo/reference
- deduction type
- gross amount
- withheld amount
- at least two journal lines required for balancing

The UI should bias toward deduction-entry workflows instead of forcing users to start from a fully blank generic journal.

## Data And API Design

### Frontend Routing

Add a new route in `apps/pwa/src/App.tsx` for `/finance/manual-entry/statutory-deductions`.

### Backend Endpoints

Add dedicated finance endpoints for statutory deduction manual entries instead of overloading the generic manual entry page silently:

- `GET /finance/manual-entry/statutory-deductions`
- `POST /finance/manual-entry/statutory-deductions`

These endpoints should use the same underlying journal-entry creation mechanics as generic manual entries, but persist a distinct `sourceType` so the two pages can list separate histories cleanly.

### Journal Source Separation

Generic manual journal entries remain:

- `sourceType: 'manual_entry'`

New statutory deduction manual entries use:

- `sourceType: 'statutory_deduction_manual_entry'`

This keeps reporting and recent-entry tables separate without changing the ledger model.

## Validation Rules

Both entry flows should preserve the existing accounting guarantees:

- at least two lines
- valid entry date
- debits must equal credits
- only lines with chart account and non-zero debit or credit are submitted

The statutory deduction entry flow adds:

- deduction type required
- gross amount must be positive
- withheld amount must be positive
- withheld amount cannot exceed gross amount

The API should reject invalid payloads with existing Nest-style `BadRequestException`s.

## Prisma Hardening

Apply a small, low-risk hardening pass to `PrismaService`.

### Required Changes

- Construct `PrismaClient` with environment-aware log levels.
- Avoid repeated connect/disconnect edge cases during Nest lifecycle hooks.
- Surface database connection failure clearly during startup.

### Constraints

- Keep the existing `PrismaService` public contract unchanged for dependent modules.
- Do not introduce app-wide retry loops or long custom connection orchestration.
- Prefer a minimal change contained to `api/src/common/prisma/prisma.service.ts`.

## Testing

### Frontend

- navigation renders the new `Manual Entries` submenu
- `Journal Entry` no longer appears in `Accounting`
- new route renders the statutory deduction entry page
- existing manual journal page still posts and refreshes correctly

### Backend

- list/create generic manual entry behavior remains unchanged
- list/create statutory deduction manual entry behavior is covered by focused service/controller tests
- Prisma service tests should verify constructor/lifecycle behavior only if the repo already has a suitable pattern; otherwise keep this to direct verification during app bootstrap tests

## Risks

- If `sourceType` is an enum in Prisma schema, adding a new source type may require schema migration and downstream code review. This must be checked before implementation.
- If existing reports assume only `manual_entry` for all manual journals, filtering logic may need a small update.
- The statutory deduction entry page should not duplicate remittance behavior already owned by the register page.

## Implementation Notes

- Prefer reusing the existing manual-entry page patterns and API helpers over creating a new abstracted form framework.
- If the current source-type model is string-based already, use the new source type directly. If it is enum-constrained, make the smallest schema-safe update needed.
- Keep the change incremental: navigation first, new page second, backend endpoint separation third, Prisma hardening last, with tests around each affected slice.
