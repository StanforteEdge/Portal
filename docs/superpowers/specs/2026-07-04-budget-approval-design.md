# Budget Approval Design

**Date:** 2026-07-04
**Status:** Draft

## Goal

Introduce a budget system that supports drafting, copying, submission, approval, revision control, and future linkage to financial requests without replacing the existing finance reporting model.

## Summary

The budget module keeps `FinanceBudget` as the long-lived budget record and adds revision-scoped approval artifacts on top of it. Each approved revision becomes an immutable baseline for reporting and request linkage. New requests will later consume approved budget revision lines, not mutable working drafts.

## Selected Approach

**Option A (selected):** `FinanceBudget` + `BudgetRevision` + request-style workflow.

- Keep `FinanceBudget` as the system of record for budget identity, scope, ownership, and rollup relationships.
- Add `BudgetRevision` and `BudgetRevisionLine` as immutable snapshots used for submission and approval.
- Reuse the existing workflow/approval pattern used by finance requests.
- Keep current and historical approved revisions reportable.

## Why This Approach

- Preserves the existing finance-facing budget structure and reporting surface.
- Avoids storing budget lines in generic request JSON.
- Supports material-change reapproval without rewriting approved budgets in place.
- Creates a clean foundation for future commitment, procurement, and payment linkage.

## Scope

### In Scope

- Budget draft creation
- Budget copy/duplicate flow
- Budget submission and approval
- Budget revisions after approval
- Revision-scoped supporting documents
- Scope-derived ownership and approval routing
- Historical approved revision reporting
- Usage manual for finance and budget owners

### Out of Scope

- Full procurement workflow
- Budget-to-request commitment posting implementation
- Multi-year consolidated budgeting
- Delegate approvers in v1
- Complex parent-child consolidated approval logic

## Core Concepts

### Budget

`FinanceBudget` remains the logical budget container.

Recommended responsibilities:
- owning scope (`organization`, `team`, `project`, `fund`, `grant`)
- primary owner
- preparer metadata
- parent/child relationship
- current active approved revision reference
- high-level reporting identity

### Budget Revision

Each approval cycle creates or updates a draft revision, which is then submitted and reviewed.

Recommended fields:
- `budget_id`
- `revision_number`
- `status` (`draft`, `submitted`, `approval`, `approved`, `returned`, `rejected`, `superseded`)
- `submission_note`
- `justification`
- `material_change_summary`
- `submitted_by`, `submitted_at`
- `approved_by`, `approved_at`
- `copied_from_revision_id` when created from copy/duplicate

### Budget Revision Lines

Each revision stores its own immutable line snapshot.

Recommended fields:
- `budget_revision_id`
- `chart_account_id` or reporting key
- `line_label`
- `section`
- per-period amounts
- `total_amount`
- `notes`
- `sort_order`

### Revision Attachments

Attachments belong to the revision being reviewed, not only the base budget.

Supported evidence types:
- narrative / justification note
- assumptions sheet
- detailed budget spreadsheet
- donor or grant support letter
- revision memo

## Ownership Model

Default owner resolution:
- `team` budget -> team lead
- `project` budget -> project lead
- `fund` / `grant` budget -> configured fund or grant manager, otherwise finance
- `organization` budget -> finance owner

Rules:
- one primary owner in v1
- finance can prepare budgets on behalf of teams/projects
- if the expected owner cannot be resolved, fallback to finance instead of blocking submission

Tracked actors:
- `owner`
- `prepared_by`
- `submitted_by`
- `approved_by`

## Period Model

V1 supports:
- annual
- quarterly
- monthly

V1 does not implement full multi-year budget logic. Multi-year programs can be represented as parent budgets with separate yearly child budgets.

## Workflow and State Machine

### Budget Lifecycle

1. Draft budget is created.
2. Draft revision is edited with lines, assumptions, and files.
3. Submission validates scope, owner, line presence, and support requirements.
4. Approval chain runs using finance request-style workflow.
5. Approved revision becomes the active approved baseline.
6. Later material edits create a new draft revision.

### Revision Status Rules

- `draft`: editable
- `submitted` / `approval`: read-only to normal editors while in review
- `returned`: editable and resubmittable
- `rejected`: preserved for audit, optionally clonable into a new draft
- `approved`: immutable
- `superseded`: historical approved revision replaced by a newer approved revision

### Approval Chain

Budget approvals follow the same pattern as financial requests:
- owner path first
- finance mandatory
- COO/ED by threshold

Approval routing remains configurable by threshold and approver type, matching the request workflow model already in the codebase.

## Material Change Rules

Approved revisions cannot be edited in place for financial fields.

Material changes requiring a new revision approval:
- total budget amount
- any line amount
- start/end dates
- project/team/fund/grant/scope allocation
- currency or exchange assumptions
- adding or removing lines

Non-material changes that may remain editable on a draft without changing approval classification:
- notes
- attachment additions
- typo fixes
- internal reference values

## Copy Budget

Copy support is required in v1.

### Supported Copy Modes

- copy full budget
- copy header only
- copy header + lines + assumptions

### Optional Period Shift Helpers

- same period
- next month
- next quarter
- next fiscal year

### Rules

- copied budget always starts as a new draft
- copied revision keeps a reference to its source
- copied files may be referenced forward for convenience, but the new revision gets its own evidence set

Primary use case:
- monthly OPEX budget copied from prior month, then adjusted and submitted

## Submission Validation

Submission should require:
- valid scope
- resolvable owner
- at least one budget line
- positive total budget
- justification or narrative
- required supporting documents by budget type/scope rules

Draft creation may be more permissive than submission.

## Reporting Model

Every approved revision remains reportable.

Required reporting views:
- original approved budget vs actual
- latest approved budget vs actual
- revision delta between approved revisions

One revision is marked as the active approved baseline for current operational use.

## Request Linkage Design

This phase does not implement request posting, but the budget design must support it.

Planned linkage behavior:
- only fully approved budgets are selectable for normal spend requests
- new requests should link to the active approved revision and its line snapshots
- existing approved requests remain linked to the revision they were approved against
- future revisions do not auto-rebind older approved requests

## Parent and Child Budgets

V1 should support both standalone and child budgets.

Rules:
- parent-child is optional, not mandatory
- approval remains at the individual budget record level in v1
- reporting can roll child totals up to parent
- consolidated approval behavior is deferred

## Permissions

Recommended permissions split:
- `finance.budgets.view`
- `finance.budgets.create`
- `finance.budgets.edit`
- `finance.budgets.submit`
- `finance.budgets.approve`
- `finance.budgets.manage`

Operational rules:
- owners and finance can create drafts
- finance can draft on behalf of business owners
- only eligible approvers can act on approval steps

## Data Model Changes

Recommended additions:
- extend `FinanceBudget` with active revision and ownership references where missing
- new `FinanceBudgetRevision`
- new `FinanceBudgetRevisionLine`
- new revision-to-file link table or equivalent attachment relation
- optional workflow instance link on revision for direct approval tracking

Recommended retention:
- keep `FinanceBudgetLine` only if needed as current working structures during migration, or replace its practical use with revision lines once the revision model is active

## API Surface

Recommended endpoints:
- `GET /finance/budgets`
- `GET /finance/budgets/:id`
- `POST /finance/budgets`
- `POST /finance/budgets/:id`
- `POST /finance/budgets/:id/copy`
- `GET /finance/budgets/:id/revisions`
- `GET /finance/budget-revisions/:revisionId`
- `POST /finance/budget-revisions/:revisionId/submit`
- `POST /finance/budget-revisions/:revisionId/approve`
- `POST /finance/budget-revisions/:revisionId/reject`
- `POST /finance/budget-revisions/:revisionId/return`
- `POST /finance/budgets/:id/revisions`

Design intent:
- budget endpoints manage logical budgets
- revision endpoints manage approval lifecycle

## UI / UX

### Budget List

- filters by scope, period, owner, status, fiscal year
- shows active approved revision status and last draft status
- copy action available from row and detail page

### Budget Detail

- summary header for scope, owner, period, and active revision
- revision switcher
- line table
- assumptions and attachments tabs
- approval timeline per revision

### Budget Editor

- works only on draft/returned revisions
- copy-from-existing flow available on create
- highlights material changes when editing from an approved baseline

## Error Handling

- block submission when required scope/owner/lines/evidence are missing
- block direct in-place edits on approved revisions
- block approval when revision is stale or no longer current submission target
- show clear validation for invalid copy-period transitions and missing scope references

## Testing

Required coverage:
- create draft budget
- copy budget into new draft
- submit revision with validation errors
- approve revision and mark active baseline
- create material-change revision from approved budget
- preserve historical approved revisions after replacement
- owner fallback to finance when no scope owner exists
- reject/return flows preserve audit trail and files

## Migration Notes

- current `FinanceBudget.status = approved` behavior is too shallow for the target workflow
- migration should preserve existing budgets as baseline records
- existing approved budgets may need an initial synthetic approved revision for continuity

## Open Decisions Deferred

- delegate/backup approvers
- configurable evidence rules by budget type in admin UI
- commitment, soft commitment, and actual posting implementation
- consolidated parent-child approval mechanics
