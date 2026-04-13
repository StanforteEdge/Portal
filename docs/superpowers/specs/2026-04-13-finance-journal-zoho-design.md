# Finance Journal (Zoho-Style) — Design Spec

## Goal
Implement a Zoho Books–style Manual Journal feature in the new PWA, covering list + create flows, approvals, multi-currency, attachments, and balanced line items.

## Scope
- New UI under `/finance/journal`
- Manual journal creation via modal (also deep-linkable)
- Journal detail modal
- Status workflow: Draft → Pending Approval → Approved/Rejected → Published
- Multi-currency support
- Attachments and notes
- Uses existing finance journal data model in API

Out of scope for this phase: report generation UI, batch imports, or custom field builder UI.

## UX / IA
### List Page (`/finance/journal`)
- Table columns: Entry No, Date, Memo, Status, Currency, Total Debit, Total Credit
- Filters: date range, status, currency, account, search (entry no/memo)
- Actions: View, Edit Draft, Submit, Publish (if no approval required), Export

### New Journal Modal
- Header: “New Journal” with auto entry number preview
- Fields: Date, Currency, Exchange Rate (if non-base), Memo, Attachments
- Line items grid:
  - Account (required, lookup)
  - Contact (optional)
  - Description
  - Debit
  - Credit
  - Optional dimensions: Organization, Team, Fund, Grant
- Totals footer with balance check (must equal)
- Primary action: Save Draft; secondary: Submit for approval / Publish (if approvals disabled)

### Journal Detail Modal
- Summary (entry no, date, status, memo, currency/rate)
- Line items table (same columns)
- Totals
- Approval timeline (if applicable)
- Attachments list

## Workflow & Rules
- Balanced enforcement: total debit must equal total credit (server + UI guard)
- Status flow:
  - Draft: editable, deletable
  - Pending Approval: read-only, can be approved/rejected
  - Approved: ready to publish (or auto-published based on settings)
  - Rejected: read-only, can be edited after revert to Draft
  - Published: immutable
- Multi-currency:
  - Journal has `currency` + `exchangeRate` (required if non-base)
  - Line amounts stored in journal currency

## API / Data Contracts
New endpoints in `api/src/modules/finance`:
- `GET /finance/journals`
- `GET /finance/journals/:id`
- `POST /finance/journals` (create draft)
- `POST /finance/journals/:id/submit`
- `POST /finance/journals/:id/approve`
- `POST /finance/journals/:id/reject`
- `POST /finance/journals/:id/publish`
- `POST /finance/journals/:id/delete` (draft only)

Backed by `FinanceJournalEntry` + `FinanceJournalLine`.

## Non-Functional
- Permissions: `finance.view` for list/detail; `finance.manage` for create/submit/approve/publish
- Audit: postedBy, createdBy tracked on entry
- Errors: balance mismatch, missing required fields, invalid status transitions

## Acceptance Criteria
- User can list journals and filter by date/status/currency.
- User can create a balanced manual journal in multi-currency.
- Approval flow works end-to-end.
- Published journals are immutable and visible in list/detail.

