# Design: Category-Aware Request Details Refactor

**Date:** 2026-05-21  
**Scope:** Frontend refactor + backend request-type model additions. No changes to existing API routes, request state machine, or `/finance/requests/details/` (out of scope).

---

## Problem

`RequestDetailsPage.tsx` is a 1,735-line monolith that routes rendering via a heuristic `classifyRequestFamily()` function — guessing the request category from taxonomy key names and request type names. This causes:

- Payment-specific UI (disbursement progress, retirement button) leaking into loan and leave requests
- `usePaymentRequest()` firing finance API calls for every request family unconditionally
- Logic duplicated across desktop and mobile layouts
- `"financial"` / `"hr"` naming that doesn't match the actual category labels (`PAYMENT`, `LEAVE`, `LOAN`) already in the UI

---

## Core Principle Change

Replace heuristic family detection with **explicit `workflow_type` routing**.

`request.request_type.workflow_type` is the single source of truth. It is set by an admin in Request Type settings and never inferred at runtime.

---

## Naming Changes

| Old | New |
|-----|-----|
| `RequestFamily` type | `WorkflowType` |
| `"financial"` | `"payment"` |
| `"hr"` | `"leave"` |
| `classifyRequestFamily()` | `classifyRequestCategory()` (fallback only, not primary path) |
| `requestFamilyFromRecord()` | `workflowTypeFromRecord()` |
| `requestFamilyFromType()` | `workflowTypeFromType()` |
| `requestFamilyLabel()` | `workflowTypeLabel()` |
| `moduleFromFamily()` | `moduleFromWorkflowType()` |
| `family === "hr"` checks | `workflowType === "leave"` |
| `family === "financial"` checks | `workflowType === "payment"` |
| `financeStatus.ts` | `paymentStatus.ts` |
| `buildFinanceViewerStatus()` | `buildPaymentViewerStatus()` |
| `buildFinanceProgress()` | `buildPaymentProgress()` |
| `FinancialRequestFormPage.tsx` | `PaymentRequestFormPage.tsx` |
| `FinanceRequestBody.tsx` | `PaymentRequestBody.tsx` |
| `useFinanceRequest.ts` | `usePaymentRequest.ts` |
| `financeActionsVisible` | `handlerActionsVisible` |
| `REQUEST_MODULES: "Financial"` | `"Payment"` |
| `detailView: "finance" \| "hr"` | `detailView: "handler"` |

---

## Request Type: Two New Fields

Added to the request type model — editable only by admins in `RequestTypeSlideOver.tsx`.

```ts
workflow_type: "payment" | "leave" | "loan" | "other"
handler_role_label: string  // e.g. "Accountant", "HR Department"
```

**`workflow_type`** drives:
- Which workflow builder runs (`buildPaymentWorkflow`, `buildLeaveWorkflow`, `buildLoanWorkflow`)
- Which status builder runs (`buildPaymentViewerStatus`, `buildLeaveViewerStatus`, `buildLoanViewerStatus`)
- Which detail view renders (`PaymentRequestDetail`, `LeaveRequestDetail`, `LoanRequestDetail`)
- Whether `usePaymentRequest()` is called (only when `payment` or `loan`)

**`handler_role_label`** replaces hardcoded strings like "Finance can now disburse…" with "Accountant can now disburse…" throughout status hints and button labels.

`classifyRequestCategory()` is retained as a **fallback** for records that pre-date the field, but the primary path is always `request.request_type.workflow_type`.

---

## Three Viewer Roles

| Role | Code variable | When active |
|------|--------------|-------------|
| Staff | `ownerActionsVisible` | `detailView === "mine"` |
| Approver | `approvalActionsVisible` | available actions include `approve`/`reject`/`return` |
| Handler | `handlerActionsVisible` | `detailView === "handler"` |

`RequestDetailsView` type: `"mine" | "approvals" | "handler"` (removes `"finance"` and `"hr"`).

UI displays handler identity from `request.request_type.handler_role_label` — "Accountant", "HR", etc. — not a hardcoded string.

---

## Category-Based Detail Routing

`RequestDetailsPage.tsx` is slimmed to ~350 lines. It fetches shared data, derives `workflowType`, and delegates to a family-specific detail view:

```
workflowType === "payment" → <PaymentRequestDetail />
workflowType === "leave"   → <LeaveRequestDetail />
workflowType === "loan"    → <LoanRequestDetail />
default                    → <OtherRequestDetail />
```

Each detail view owns its right-rail: summary card, status card, stepper, action buttons, downloads. No cross-family UI bleeds.

---

## Loan Workflow Stepper

`buildLoanWorkflow()` replaces the reused `buildWorkflow()` for loan requests. Steps:

| Step | Status logic |
|------|-------------|
| Drafted | Same as `buildPaymentWorkflow` |
| [Dynamic approval steps] | From `request_type.approval_flow_json.steps` |
| Disbursed | `current` when `status === "cleared"` or partial disburse; `complete` once fully disbursed |
| Active | `current` when `status === "confirmed"` (repayments running); `complete` when `status === "completed"` |
| Completed | `current` when `status === "retired"`; `complete` when `status === "completed"` |

No "Retirement" step. Retire button is not shown for loan requests.

---

## Status Files

| File | Exports |
|------|---------|
| `status/paymentStatus.ts` | `buildPaymentViewerStatus()`, `buildPaymentProgress()` |
| `status/leaveStatus.ts` | `buildLeaveViewerStatus()` — unchanged |
| `status/loanStatus.ts` | `buildLoanViewerStatus()` — new |
| `status/types.ts` | `ViewerStatus`, `PaymentProgress` (was `FinanceProgress`) |

---

## Dialogs and Layout

- Each dialog (`DisburseDialog`, `RetireDialog`, `VoucherPreviewDialog`) lives in its own file under `bodies/PaymentRequestBody/`
- All dialogs use the shared `<Dialog>` component — no inline implementations
- Pages are fully responsive — no separate `DesktopLayout.tsx` / `MobileLayout.tsx` files

---

## Proposed File Structure

```
apps/pwa/src/pages/requests/
├── RequestDetailsPage.tsx                   [MODIFY] slim to ~350 lines
├── request-helpers.ts                       [MODIFY] rename types + functions
├── hooks/
│   └── usePaymentRequest.ts                 [RENAME from useFinanceRequest.ts]
├── status/
│   ├── types.ts                             [MODIFY] FinanceProgress → PaymentProgress
│   ├── paymentStatus.ts                     [RENAME from financeStatus.ts]
│   ├── leaveStatus.ts                       [KEEP]
│   └── loanStatus.ts                        [NEW]
├── bodies/
│   ├── LeaveRequestBody.tsx                 [KEEP]
│   ├── LoanRequestBody.tsx                  [NEW]
│   └── PaymentRequestBody/                  [RENAME + REFACTOR from FinanceRequestBody.tsx]
│       ├── index.tsx
│       ├── DisburseDialog.tsx
│       ├── RetireDialog.tsx
│       └── VoucherPreviewDialog.tsx
├── new/forms/
│   └── PaymentRequestFormPage.tsx           [RENAME from FinancialRequestFormPage.tsx]
└── details/
    ├── context.ts                           [NEW]
    ├── shared/
    │   ├── WorkflowStepperCard.tsx          [NEW]
    │   ├── ActivitySection.tsx              [NEW]
    │   ├── DownloadsSection.tsx             [NEW]
    │   └── NudgeSection.tsx                 [NEW]
    ├── PaymentRequestDetail.tsx             [NEW]
    ├── LeaveRequestDetail.tsx               [NEW]
    ├── LoanRequestDetail.tsx                [NEW]
    └── OtherRequestDetail.tsx               [NEW]
```

Backend (`api/`):
```
api/src/modules/requests/dto/
├── create-type.dto.ts    [MODIFY] add workflow_type, handler_role_label
└── update-type.dto.ts    [MODIFY] add workflow_type, handler_role_label
api/prisma/schema.prisma  [MODIFY] add fields to RequestType model
```

Admin UI:
```
apps/pwa/src/pages/admin/request-types/
└── RequestTypeSlideOver.tsx  [MODIFY] add workflow_type selector + handler_role_label input
```

---

## Phased Execution

### Phase 1 — Rename + category routing (low risk, no behaviour change)

**Goal:** Correct all naming and replace the heuristic with explicit `workflow_type`.

Files touched:
- `request-helpers.ts` — rename `RequestFamily` → `WorkflowType`, rename all functions
- `financeStatus.ts` → `paymentStatus.ts` — rename exports
- `FinancialRequestFormPage.tsx` → `PaymentRequestFormPage.tsx`
- `useFinanceRequest.ts` → `usePaymentRequest.ts`
- `FinanceRequestBody.tsx` → `PaymentRequestBody/index.tsx`
- `RequestDetailsPage.tsx` — update all `family` references to `workflowType`, update `detailView` type
- `status/types.ts` — rename `FinanceProgress` → `PaymentProgress`
- `api/prisma/schema.prisma` + DTOs — add `workflow_type`, `handler_role_label`
- `RequestTypeSlideOver.tsx` — add admin fields

### Phase 2 — Loan isolation (immediate correctness fix)

**Goal:** Loan requests stop showing retirement UI.

Files created/modified:
- `status/loanStatus.ts` — `buildLoanViewerStatus()`
- `bodies/LoanRequestBody.tsx` — principal, type, org, repayment schedule; no PV table
- `details/LoanRequestDetail.tsx` — right-rail with loan stepper; no Retire/Disburse/Complete buttons
- `RequestDetailsPage.tsx` — add `workflowType === "loan"` branch

### Phase 3 — Context + full category routing (medium risk)

**Goal:** Each request type renders its own isolated right-rail. Stop `usePaymentRequest()` running unconditionally.

Files created/modified:
- `details/context.ts` — `RequestDetailsContext` with shared state
- `details/shared/` — extract `WorkflowStepperCard`, `ActivitySection`, `DownloadsSection`, `NudgeSection`
- `details/PaymentRequestDetail.tsx` — payment right-rail + handler actions
- `details/LeaveRequestDetail.tsx` — leave right-rail
- `details/OtherRequestDetail.tsx` — generic right-rail
- `RequestDetailsPage.tsx` — wrap in context provider, route to detail views
- `usePaymentRequest.ts` — gate to `workflowType === "payment" || "loan"` only

### Phase 4 — PaymentRequestBody decomposition (separate PR)

**Goal:** Break 1,470-line `PaymentRequestBody` into focused files with extracted dialogs.

Files created:
- `PaymentRequestBody/DisburseDialog.tsx` — uses shared `<Dialog>`
- `PaymentRequestBody/RetireDialog.tsx` — uses shared `<Dialog>`
- `PaymentRequestBody/VoucherPreviewDialog.tsx` — uses shared `<Dialog>`
- `PaymentRequestBody/index.tsx` — thin orchestrator, responsive (no desktop/mobile split)

---

## Verification

```bash
pnpm --filter pwa tsc --noEmit
pnpm --filter api build
```

Manual testing matrix:

| Scenario | Expected |
|----------|----------|
| Loan request — disbursed state | "Loan Active" status, "Confirm Loan Receipt" button, no Retire button |
| Loan request — confirmed state | "Active" stepper step, no pending actions |
| Loan request — draft | "Submit Request" only |
| Payment request — disbursed | "Retire PV" button + payment progress bar |
| Leave request | No amounts, no payment blocks |
| Approver viewing any type | Approve/Reject/Return buttons only |
| Handler viewing payment request | Disburse + Complete actions visible |
| Request type with `workflow_type` unset | Falls back to `classifyRequestCategory()` |
