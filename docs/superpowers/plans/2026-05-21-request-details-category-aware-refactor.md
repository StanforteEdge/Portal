# Category-Aware Request Details Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace heuristic family detection with explicit `workflow_type`-driven routing across the request form and details pages, rename all `financial`/`hr` identifiers to `payment`/`leave`, isolate loan UI from payment UI, and introduce a three-role viewer model (staff / approver / handler).

**Architecture:** `RequestDetailsPage.tsx` becomes a thin orchestrator reading `request.request_type.workflow_type` (set by admin, with heuristic fallback) and delegating to family-specific detail views via a shared context. The new `workflow_type` + `handler_role_label` fields on `RequestType` remove all name-guessing at runtime.

**Tech Stack:** TypeScript, React, NestJS, Prisma, pnpm monorepo (`apps/pwa` = frontend, `api` = backend). Type-check command: `pnpm --filter pwa tsc --noEmit`. Backend build: `pnpm --filter api build`.

**Spec:** `docs/superpowers/specs/2026-05-21-request-details-category-aware-refactor-design.md`

**Phase 4 (PaymentRequestBody decomposition into dialog files) is a separate PR — stop after Task 14.**

---

## File Map

### Backend
| Action | Path |
|--------|------|
| Modify | `api/prisma/schema.prisma` — add `workflowType`, `handlerRoleLabel` to `RequestType` |
| Modify | `api/src/modules/requests/dto/create-type.dto.ts` |
| Modify | `api/src/modules/requests/dto/update-type.dto.ts` |
| Modify | `api/src/modules/requests/requests.service.ts` — pass new fields in create/update |

### Frontend — Phase 1 renames
| Action | Path |
|--------|------|
| Modify | `apps/pwa/src/pages/requests/request-helpers.ts` — `WorkflowType`, rename all functions |
| Modify | `apps/pwa/src/pages/requests/status/types.ts` — `FinanceProgress` → `PaymentProgress` |
| Rename + modify | `apps/pwa/src/pages/requests/status/financeStatus.ts` → `paymentStatus.ts` |
| Rename + modify | `apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts` → `usePaymentRequest.ts` |
| Rename | `apps/pwa/src/pages/requests/new/forms/FinancialRequestFormPage.tsx` → `PaymentRequestFormPage.tsx` |
| Rename + modify | `apps/pwa/src/pages/requests/bodies/FinanceRequestBody.tsx` → `PaymentRequestBody/index.tsx` |
| Modify | `apps/pwa/src/pages/requests/new/RequestFormPage.tsx` — all `family` → `workflowType` |
| Modify | `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` — all renames, `detailView` type |
| Modify | `apps/pwa/src/pages/requests/requests-api.ts` — `RequestTypeOption` new fields |
| Modify | `apps/pwa/src/pages/admin/request-types/RequestTypeSlideOver.tsx` — admin fields |

### Frontend — Phase 2 (loan isolation)
| Action | Path |
|--------|------|
| Create | `apps/pwa/src/pages/requests/status/loanStatus.ts` |
| Create | `apps/pwa/src/pages/requests/bodies/LoanRequestBody.tsx` |
| Modify | `apps/pwa/src/pages/requests/request-helpers.ts` — add `buildLoanWorkflow()` |
| Create | `apps/pwa/src/pages/requests/details/LoanRequestDetail.tsx` |
| Modify | `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` — loan routing branch |

### Frontend — Phase 3 (context + full routing)
| Action | Path |
|--------|------|
| Create | `apps/pwa/src/pages/requests/details/context.ts` |
| Create | `apps/pwa/src/pages/requests/details/shared/WorkflowStepperCard.tsx` |
| Create | `apps/pwa/src/pages/requests/details/shared/DownloadsSection.tsx` |
| Create | `apps/pwa/src/pages/requests/details/shared/NudgeSection.tsx` |
| Create | `apps/pwa/src/pages/requests/details/shared/ActivitySection.tsx` |
| Create | `apps/pwa/src/pages/requests/details/PaymentRequestDetail.tsx` |
| Create | `apps/pwa/src/pages/requests/details/LeaveRequestDetail.tsx` |
| Create | `apps/pwa/src/pages/requests/details/OtherRequestDetail.tsx` |
| Modify | `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` — full routing + context |
| Modify | `apps/pwa/src/pages/requests/hooks/usePaymentRequest.ts` — gate via skip |

---

## Task 1 — Backend: `workflow_type` + `handler_role_label` on RequestType

**Files:**
- Modify: `api/prisma/schema.prisma`
- Modify: `api/src/modules/requests/dto/create-type.dto.ts`
- Modify: `api/src/modules/requests/dto/update-type.dto.ts`
- Modify: `api/src/modules/requests/requests.service.ts`

- [ ] **Step 1: Add fields to Prisma schema**

In `api/prisma/schema.prisma`, inside `model RequestType { }`, add two lines after the `isActive` line:

```prisma
  workflowType     String?  @map("workflow_type") @db.VarChar(20)
  handlerRoleLabel String?  @map("handler_role_label") @db.VarChar(100)
```

- [ ] **Step 2: Add fields to create DTO**

In `api/src/modules/requests/dto/create-type.dto.ts`, add after the last existing optional field:

```ts
@IsOptional()
@IsString()
workflow_type?: string;

@IsOptional()
@IsString()
handler_role_label?: string;
```

(Add the same imports if `IsOptional` / `IsString` are not already imported from `class-validator`.)

- [ ] **Step 3: Add fields to update DTO**

In `api/src/modules/requests/dto/update-type.dto.ts`, add the same two fields:

```ts
@IsOptional()
@IsString()
workflow_type?: string;

@IsOptional()
@IsString()
handler_role_label?: string;
```

- [ ] **Step 4: Pass fields through in the service**

In `api/src/modules/requests/requests.service.ts`, find the method that calls `this.prisma.requestType.create(...)` and add to its `data` block:

```ts
workflowType: dto.workflow_type ?? null,
handlerRoleLabel: dto.handler_role_label ?? null,
```

Find the method that calls `this.prisma.requestType.update(...)` and add to its `data` block:

```ts
...(dto.workflow_type !== undefined && { workflowType: dto.workflow_type }),
...(dto.handler_role_label !== undefined && { handlerRoleLabel: dto.handler_role_label }),
```

- [ ] **Step 5: Run migration**

```bash
cd api && npx prisma migrate dev --name add_workflow_type_to_request_type
```

Expected: migration created and applied, no errors.

- [ ] **Step 6: Verify backend builds**

```bash
pnpm --filter api build
```

Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations api/src/modules/requests/dto/create-type.dto.ts api/src/modules/requests/dto/update-type.dto.ts api/src/modules/requests/requests.service.ts
git commit -m "feat(api): add workflow_type and handler_role_label to RequestType"
```

---

## Task 2 — Frontend API type + core WorkflowType rename in request-helpers.ts

**Files:**
- Modify: `apps/pwa/src/pages/requests/requests-api.ts`
- Modify: `apps/pwa/src/pages/requests/request-helpers.ts`

- [ ] **Step 1: Add new fields to `RequestTypeOption`**

In `apps/pwa/src/pages/requests/requests-api.ts`, find the `RequestTypeOption` type/interface and add:

```ts
workflow_type?: string | null;
handler_role_label?: string | null;
```

- [ ] **Step 2: Replace `RequestFamily` with `WorkflowType` in request-helpers.ts**

Replace the type declaration:

```ts
// old
export type RequestFamily = "financial" | "hr" | "other" | "loan";

// new
export type WorkflowType = "payment" | "leave" | "loan" | "other";
```

- [ ] **Step 3: Update `REQUEST_MODULES`**

```ts
// old
export const REQUEST_MODULES: RequestModule[] = [
  { id: "module-hr", name: "Human Resources", code: "HR" },
  { id: "module-financial", name: "Financial", code: "FIN" },
];

// new
export const REQUEST_MODULES: RequestModule[] = [
  { id: "module-hr", name: "Human Resources", code: "HR" },
  { id: "module-payment", name: "Payment", code: "PAY" },
];
```

- [ ] **Step 4: Rename `classifyRequestFamily` → `classifyRequestCategory` and fix return values**

```ts
export function classifyRequestCategory(
  categoryKey?: string | null,
  requestTypeName?: string | null,
  categoryCode?: string | null,
): WorkflowType {
  if (categoryCode) {
    const c = categoryCode.toLowerCase();
    if (c === "leave") return "leave";
    if (c === "payment" || c === "expense") return "payment";
    if (c.includes("loan") || c.includes("salary") || c.includes("advance")) return "loan";
  }

  if (categoryKey) {
    const c = categoryKey.toLowerCase();
    if (c.includes("leave")) return "leave";
    if (c.includes("finance") || c.includes("payment") || c.includes("expense") || c.includes("reimbursement") || c.includes("procurement")) return "payment";
    if (c.includes("loan") || c.includes("salary") || c.includes("advance")) return "loan";
  }

  if (requestTypeName) {
    const n = requestTypeName.toLowerCase();
    if (n.includes("leave")) return "leave";
    if (n.includes("finance") || n.includes("payment") || n.includes("expense") || n.includes("reimbursement") || n.includes("procurement")) return "payment";
    if (n.includes("loan") || n.includes("salary") || n.includes("advance")) return "loan";
  }

  return "other";
}
```

- [ ] **Step 5: Rename helper functions that reference `RequestFamily`**

```ts
export function workflowTypeLabel(type: WorkflowType) {
  if (type === "leave") return "Leave";
  if (type === "payment") return "Payment";
  if (type === "loan") return "Loan";
  return "Other";
}

export function moduleFromWorkflowType(type: WorkflowType): RequestModule | undefined {
  if (type === "leave" || type === "loan") return REQUEST_MODULES[0];
  if (type === "payment") return REQUEST_MODULES[1];
  return undefined;
}

export function workflowTypeFromType(type?: RequestTypeOption | null): WorkflowType {
  if (type?.workflow_type) return type.workflow_type as WorkflowType;
  return classifyRequestCategory(
    type?.taxonomyKeys?.[0] ?? type?.taxonomy_keys?.[0],
    type?.name,
    null,
  );
}

export function workflowTypeFromRecord(request?: any | null): WorkflowType {
  if (request?.request_type?.workflow_type) {
    return request.request_type.workflow_type as WorkflowType;
  }
  return classifyRequestCategory(
    request?.request_type?.taxonomy_keys?.[0],
    request?.request_type?.name,
    request?.group?.name,
  );
}
```

Delete the old functions: `requestFamilyLabel`, `moduleFromFamily`, `requestFamilyFromType`, `requestFamilyFromTypeSimple`, `requestFamilyFromRecord`.

- [ ] **Step 6: Run type-check to find all remaining `RequestFamily` / `classifyRequestFamily` references**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep -E "RequestFamily|classifyRequestFamily|family.*financial|family.*hr" | head -30
```

Expected: errors listing every file that still imports the old names — these are fixed in subsequent tasks.

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/pages/requests/requests-api.ts apps/pwa/src/pages/requests/request-helpers.ts
git commit -m "refactor(requests): rename RequestFamily → WorkflowType, classifyRequestFamily → classifyRequestCategory"
```

---

## Task 3 — Rename status files and hook; add skip to usePaymentRequest

**Files:**
- Modify/rename: `apps/pwa/src/pages/requests/status/types.ts`
- Rename+modify: `apps/pwa/src/pages/requests/status/financeStatus.ts` → `paymentStatus.ts`
- Rename+modify: `apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts` → `usePaymentRequest.ts`

- [ ] **Step 1: Rename `FinanceProgress` → `PaymentProgress` in `status/types.ts`**

```ts
export type StatusTone =
  | "success"
  | "warning"
  | "pending"
  | "danger"
  | "neutral";

export type ViewerStatus = {
  label: string;
  hint: string;
  tone: StatusTone;
};

export type PaymentProgress = {
  label: string;
  hint: string;
};
```

- [ ] **Step 2: Copy `financeStatus.ts` to `paymentStatus.ts` with renames**

Create `apps/pwa/src/pages/requests/status/paymentStatus.ts`:

```ts
import { formatCurrency } from "@stanforte/shared";
import { formatViewerRequestStatus } from "@/pages/requests/request-helpers";
import type { PaymentProgress, StatusTone, ViewerStatus } from "./types";

type BuildPaymentViewerStatusInput = {
  approvalActionsVisible: boolean;
  ownerActionsVisible: boolean;
  handlerActionsVisible: boolean;
  requestStatus: string;
  workflowStatus: string;
  availableActions: string[];
  pendingStep?: string | null;
  roles: string[];
  permissions: string[];
  statusTone: StatusTone;
  workflowType?: string;
  handlerRoleLabel?: string;
};

type BuildPaymentProgressInput = {
  requestStatus: string;
  requestTotal: number;
  disbursedTotal: number;
  remainingDisbursement: number;
  currency?: string | null;
};

export function buildPaymentViewerStatus(
  input: BuildPaymentViewerStatusInput,
): ViewerStatus {
  const {
    approvalActionsVisible,
    ownerActionsVisible,
    handlerActionsVisible,
    requestStatus,
    workflowStatus,
    availableActions,
    pendingStep,
    roles,
    permissions,
    statusTone,
    workflowType,
    handlerRoleLabel = "Finance",
  } = input;

  if (approvalActionsVisible) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: handlerActionsVisible
        ? `${handlerRoleLabel} is the current approver for this request. Clear it here for disbursement or the next step.`
        : "You are the current approver for this step.",
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("submit")) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: "You can still revise this before submission.",
      tone: "neutral",
    };
  }

  if (handlerActionsVisible && availableActions.includes("disburse")) {
    return {
      label: "Ready for Disbursement",
      hint: `${handlerRoleLabel} can now disburse the request and start voucher handling.`,
      tone: "success",
    };
  }

  if (ownerActionsVisible && availableActions.includes("confirm")) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: `${handlerRoleLabel} has disbursed this request. Confirm receipt here once the funds or voucher reach you.`,
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("retire")) {
    if (workflowType === "loan") {
      return {
        label: "Loan Disbursed",
        hint: "Your loan has been disbursed. No further action is required from you at this stage.",
        tone: "success",
      };
    }
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: "After spending the disbursed amount, submit retirement details and receipt support here.",
      tone: "warning",
    };
  }

  if (handlerActionsVisible && availableActions.includes("complete")) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: `${handlerRoleLabel} can verify the retirement and complete this request.`,
      tone: "warning",
    };
  }

  if (requestStatus === "approval") {
    const isHandlerViewer =
      roles.some((r) => r.includes("finance") || r === "accountant") ||
      permissions.some((p) => p === "finance.approve");
    return {
      label: isHandlerViewer ? "In Approval Workflow" : "In Review",
      hint: isHandlerViewer
        ? "This request is progressing through the approval chain."
        : "Your request is currently under review.",
      tone: "warning",
    };
  }

  if (requestStatus === "cleared") {
    return {
      label: "Ready for Disbursement",
      hint: `${handlerRoleLabel} can now prepare disbursement and voucher handling.`,
      tone: "success",
    };
  }

  return {
    label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
    hint: "This reflects the current workflow state for your view.",
    tone: statusTone,
  };
}

export function buildPaymentProgress(
  input: BuildPaymentProgressInput,
): PaymentProgress {
  const { requestStatus, requestTotal, disbursedTotal, remainingDisbursement, currency } = input;

  if (requestStatus === "cleared") {
    return {
      label: "Ready for Disbursement",
      hint: "Finance can release the first payment voucher or split the request across multiple vouchers.",
    };
  }
  if (requestStatus === "disbursed") {
    if (requestTotal > 0 && disbursedTotal < requestTotal) {
      return {
        label: "Partially Disbursed",
        hint: `${formatCurrency(remainingDisbursement, currency)} remains to be disbursed before requester confirmation.`,
      };
    }
    return {
      label: "Awaiting Confirmation",
      hint: "The disbursement is complete. The requester should confirm receipt before retirement.",
    };
  }
  if (requestStatus === "confirmed") {
    return { label: "Awaiting Retirement", hint: "The requester has confirmed receipt. Retirement support can now be submitted." };
  }
  if (requestStatus === "retired") {
    return { label: "Awaiting Verification", hint: "Finance should verify the retirement records before the request can close." };
  }
  if (requestStatus === "completed") {
    return { label: "Completed", hint: "The payment workflow has been fully closed." };
  }
  return { label: "", hint: "" };
}
```

- [ ] **Step 3: Delete the old `financeStatus.ts`**

```bash
rm apps/pwa/src/pages/requests/status/financeStatus.ts
```

- [ ] **Step 4: Create `usePaymentRequest.ts` with `skip` option**

Copy `hooks/useFinanceRequest.ts` to `hooks/usePaymentRequest.ts`, then make these changes:

1. Rename the exported type `UseFinanceRequestResult` → `UsePaymentRequestResult`
2. Rename the exported function `useFinanceRequest` → `usePaymentRequest`
3. Add `options?: { skip?: boolean }` as the fourth parameter
4. Add `const skip = options?.skip ?? false;` as the first line inside the function body
5. Replace the `financeApi.listAccounts` query:

```ts
const { data: financeAccounts } = useCachedQuery(
  "finance:accounts:options",
  () => skip ? Promise.resolve(null) : financeApi.listAccounts({ is_active: true }),
  { ttlMs: 1000 * 60 * 10, storage: "memory" },
);
```

6. Replace the `listRequestPaymentVouchers` query:

```ts
const { data: paymentVouchers, refetch: refetchPaymentVouchers } = useCachedQuery(
  `requests:detail:payment-vouchers:${requestId || "none"}`,
  () => skip || !requestId ? Promise.resolve([]) : financeApi.listRequestPaymentVouchers(requestId),
  { ttlMs: 1000 * 60, storage: "memory" },
);
```

- [ ] **Step 5: Delete old hook file**

```bash
rm apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts
```

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/requests/status/ apps/pwa/src/pages/requests/hooks/
git commit -m "refactor(requests): rename financeStatus → paymentStatus, useFinanceRequest → usePaymentRequest"
```

---

## Task 4 — Rename form and body files

**Files:**
- Rename: `new/forms/FinancialRequestFormPage.tsx` → `PaymentRequestFormPage.tsx`
- Rename+restructure: `bodies/FinanceRequestBody.tsx` → `bodies/PaymentRequestBody/index.tsx`

- [ ] **Step 1: Rename the payment form file**

```bash
mv apps/pwa/src/pages/requests/new/forms/FinancialRequestFormPage.tsx \
   apps/pwa/src/pages/requests/new/forms/PaymentRequestFormPage.tsx
```

- [ ] **Step 2: Rename the exported component inside**

In `PaymentRequestFormPage.tsx`, rename `FinancialRequestFormPage` → `PaymentRequestFormPage` (both the function definition and the `displayName`).

- [ ] **Step 3: Create `PaymentRequestBody/` folder and move body**

```bash
mkdir -p apps/pwa/src/pages/requests/bodies/PaymentRequestBody
mv apps/pwa/src/pages/requests/bodies/FinanceRequestBody.tsx \
   apps/pwa/src/pages/requests/bodies/PaymentRequestBody/index.tsx
```

- [ ] **Step 4: Update imports inside `PaymentRequestBody/index.tsx`**

Find any self-referential imports or relative paths that assumed the old file location and fix them. Also update any import of `UseFinanceRequestResult` → `UsePaymentRequestResult` from `../hooks/usePaymentRequest`.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/requests/new/forms/ apps/pwa/src/pages/requests/bodies/
git commit -m "refactor(requests): rename FinancialRequestFormPage → PaymentRequestFormPage, FinanceRequestBody → PaymentRequestBody"
```

---

## Task 5 — Update `RequestFormPage.tsx`

**Files:**
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`

- [ ] **Step 1: Update imports**

```ts
// Remove:
import { classifyRequestFamily, type RequestFamily } from "@/pages/requests/request-helpers";
import { FinancialRequestFormPage } from "@/pages/requests/new/forms/FinancialRequestFormPage";

// Add:
import { workflowTypeFromType, type WorkflowType } from "@/pages/requests/request-helpers";
import { PaymentRequestFormPage } from "@/pages/requests/new/forms/PaymentRequestFormPage";
```

- [ ] **Step 2: Rename local `family` variable to `workflowType` with new derivation**

Find the `family: RequestFamily = useMemo(...)` declaration (around line 250) and replace:

```ts
const workflowType: WorkflowType = useMemo(() => {
  const selected = requestTypes?.find((t) => t.id === form.request_type_id) ?? null;
  return workflowTypeFromType(selected);
}, [form.request_type_id, requestTypes]);
```

- [ ] **Step 3: Replace all `family` references with `workflowType` and fix string literals**

Do a find-and-replace within the file:
- `family === "financial"` → `workflowType === "payment"`
- `family === "hr"` → `workflowType === "leave"`
- `family === "loan"` → `workflowType === "loan"`
- `family !== "hr"` → `workflowType !== "leave"`
- `family !== "loan"` → `workflowType !== "loan"`
- `<FinancialRequestFormPage` → `<PaymentRequestFormPage`
- Any remaining `family` → `workflowType`

- [ ] **Step 4: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "RequestFormPage" | head -20
```

Expected: no errors in this file.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/requests/new/RequestFormPage.tsx
git commit -m "refactor(requests): update RequestFormPage to use WorkflowType"
```

---

## Task 6 — Update `RequestDetailsPage.tsx` (Phase 1 renames)

**Files:**
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`

- [ ] **Step 1: Update imports at the top of the file**

```ts
// Remove:
import { useFinanceRequest } from "./hooks/useFinanceRequest";
import { buildFinanceProgress, buildFinanceViewerStatus } from "./status/financeStatus";
import {
  buildLeaveWorkflow,
  buildWorkflow,
  ...,
  requestFamilyFromRecord,
  ...
} from "@/pages/requests/request-helpers";

// Add:
import { usePaymentRequest } from "./hooks/usePaymentRequest";
import { buildPaymentProgress, buildPaymentViewerStatus } from "./status/paymentStatus";
import {
  buildLeaveWorkflow,
  buildWorkflow,
  ...,
  workflowTypeFromRecord,
  type WorkflowType,
  ...
} from "@/pages/requests/request-helpers";
```

- [ ] **Step 2: Update `RequestDetailsView` type**

```ts
// old
export type RequestDetailsView = "mine" | "approvals" | "finance" | "hr";

// new
export type RequestDetailsView = "mine" | "approvals" | "handler";
```

- [ ] **Step 3: Derive `workflowType` and `handlerRoleLabel` instead of `family`**

Replace:
```ts
const family = requestFamilyFromRecord(request || undefined);
```
With:
```ts
const workflowType: WorkflowType =
  (request?.request_type?.workflow_type as WorkflowType | undefined) ??
  workflowTypeFromRecord(request || undefined);
const handlerRoleLabel = String(request?.request_type?.handler_role_label || "Finance");
```

- [ ] **Step 4: Update `financeActionsVisible` → `handlerActionsVisible`**

```ts
// old
const financeActionsVisible = detailView === "finance";

// new
const handlerActionsVisible = detailView === "handler";
```

- [ ] **Step 5: Update the `useFinanceRequest` call**

```ts
// old
const finance = useFinanceRequest(id, requestTotal, availableActions);

// new — still unconditional (gated in Phase 3), pass skip for non-payment/loan
const payment = usePaymentRequest(id, requestTotal, availableActions);
```

Rename all subsequent references from `finance.` → `payment.` throughout the file.

- [ ] **Step 6: Update `viewerStatus` memo — replace `buildFinanceViewerStatus` call**

```ts
return buildPaymentViewerStatus({
  approvalActionsVisible,
  ownerActionsVisible,
  handlerActionsVisible,
  requestStatus,
  workflowStatus,
  availableActions,
  pendingStep,
  roles,
  permissions,
  statusTone,
  workflowType,
  handlerRoleLabel,
});
```

And the `family === "hr"` branch:
```ts
if (workflowType === "leave") {
  return buildLeaveViewerStatus({ ... });
}
```

- [ ] **Step 7: Update `financeProgress` memo**

```ts
const paymentProgress = useMemo(() => {
  if (!request || workflowType === "leave") return { label: "", hint: "" };
  return buildPaymentProgress({
    requestStatus,
    requestTotal,
    disbursedTotal: payment.disbursedTotal,
    remainingDisbursement: payment.remainingDisbursement,
    currency: request.currency,
  });
}, [payment.disbursedTotal, payment.remainingDisbursement, workflowType, request, requestStatus, requestTotal]);
```

- [ ] **Step 8: Update all remaining `family` checks in JSX**

- `family === "hr"` → `workflowType === "leave"` (body rendering, summary cards, total card)
- `family !== "hr"` → `workflowType !== "leave"` (downloads `includeFullDocument`)
- `family !== "loan"` → `workflowType !== "loan"` (retire button)
- `financeActionsVisible` → `handlerActionsVisible` (all button visibility checks)
- `financeProgress` → `paymentProgress` in JSX

- [ ] **Step 9: Update `detailPathForView`**

```ts
function detailPathForView(view: RequestDetailsView, id: string) {
  if (view === "handler") return `/finance/requests/${id}`;
  if (view === "approvals") return `/requests/approvals/${id}`;
  return `/requests/${id}`;
}
```

- [ ] **Step 10: Update `parentPath` / `parentLabel` / nav derivations to remove `"hr"` / `"finance"` string literals** — replace with `"handler"` checks.

- [ ] **Step 11: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "RequestDetailsPage" | head -30
```

Fix any remaining type errors before committing.

- [ ] **Step 12: Grep for any remaining old identifiers**

```bash
grep -n "financeActionsVisible\|RequestFamily\|classifyRequestFamily\|buildFinanceViewerStatus\|buildFinanceProgress\|useFinanceRequest\|FinanceRequestBody\|FinancialRequest" apps/pwa/src/pages/requests/RequestDetailsPage.tsx
```

Expected: no output.

- [ ] **Step 13: Commit**

```bash
git add apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "refactor(requests): update RequestDetailsPage to WorkflowType + handlerActionsVisible"
```

---

## Task 7 — Admin UI: `RequestTypeSlideOver.tsx` + Phase 1 type-check

**Files:**
- Modify: `apps/pwa/src/pages/admin/request-types/RequestTypeSlideOver.tsx`

- [ ] **Step 1: Add `workflow_type` selector**

Inside the form in `RequestTypeSlideOver.tsx`, add after the existing fields (description, approval flow, etc.):

```tsx
<SelectField
  label="Workflow Type"
  helpText="Determines the approval steps and actions available for this request type."
  value={form.workflow_type ?? ""}
  onChange={(e) => setForm((prev) => ({ ...prev, workflow_type: e.target.value }))}
>
  <option value="">Auto-detect (legacy)</option>
  <option value="payment">Payment</option>
  <option value="leave">Leave</option>
  <option value="loan">Loan</option>
  <option value="other">Other</option>
</SelectField>
```

- [ ] **Step 2: Add `handler_role_label` input**

```tsx
<TextField
  label="Handler Role Label"
  helpText='Shown in status hints and action buttons (e.g. "Accountant", "HR Department").'
  value={form.handler_role_label ?? ""}
  onChange={(e) => setForm((prev) => ({ ...prev, handler_role_label: e.target.value }))}
  placeholder="e.g. Accountant"
/>
```

- [ ] **Step 3: Ensure both fields are included in the form submit payload**

In the submit handler, include:
```ts
workflow_type: form.workflow_type || undefined,
handler_role_label: form.handler_role_label || undefined,
```

- [ ] **Step 4: Full Phase 1 type-check**

```bash
pnpm --filter pwa tsc --noEmit
```

Expected: zero errors. Fix any before continuing.

- [ ] **Step 5: Commit Phase 1**

```bash
git add apps/pwa/src/pages/admin/request-types/RequestTypeSlideOver.tsx
git commit -m "feat(admin): add workflow_type and handler_role_label to request type settings"
```

---

## Task 8 — Phase 2: `loanStatus.ts` + `buildLoanWorkflow()`

**Files:**
- Create: `apps/pwa/src/pages/requests/status/loanStatus.ts`
- Modify: `apps/pwa/src/pages/requests/request-helpers.ts`

- [ ] **Step 1: Create `loanStatus.ts`**

Create `apps/pwa/src/pages/requests/status/loanStatus.ts`:

```ts
import { formatViewerRequestStatus } from "@/pages/requests/request-helpers";
import type { StatusTone, ViewerStatus } from "./types";

type BuildLoanViewerStatusInput = {
  approvalActionsVisible: boolean;
  ownerActionsVisible: boolean;
  handlerActionsVisible: boolean;
  requestStatus: string;
  workflowStatus: string;
  availableActions: string[];
  pendingStep?: string | null;
  statusTone: StatusTone;
  handlerRoleLabel?: string;
};

export function buildLoanViewerStatus(
  input: BuildLoanViewerStatusInput,
): ViewerStatus {
  const {
    approvalActionsVisible,
    ownerActionsVisible,
    handlerActionsVisible,
    requestStatus,
    workflowStatus,
    availableActions,
    pendingStep,
    statusTone,
    handlerRoleLabel = "Finance",
  } = input;

  if (approvalActionsVisible) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: handlerActionsVisible
        ? `${handlerRoleLabel} is the current approver. Clear it here to proceed.`
        : "You are the current approver for this step.",
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("submit")) {
    return {
      label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
      hint: "You can still revise this before submission.",
      tone: "neutral",
    };
  }

  if (handlerActionsVisible && availableActions.includes("disburse")) {
    return {
      label: "Ready for Disbursement",
      hint: `${handlerRoleLabel} can now disburse the loan amount.`,
      tone: "success",
    };
  }

  if (ownerActionsVisible && availableActions.includes("confirm")) {
    return {
      label: "Awaiting Your Confirmation",
      hint: `${handlerRoleLabel} has disbursed your loan. Confirm receipt to activate your repayment schedule.`,
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("retire")) {
    return {
      label: "Loan Disbursed",
      hint: "Your loan has been disbursed. No further action is required from you at this stage.",
      tone: "success",
    };
  }

  if (requestStatus === "confirmed" || requestStatus === "cleared") {
    return {
      label: "Loan Active",
      hint: "Your loan is active. Repayments will be deducted from your payroll as scheduled.",
      tone: "success",
    };
  }

  if (requestStatus === "approval") {
    return {
      label: "In Review",
      hint: "Your loan request is currently under review.",
      tone: "warning",
    };
  }

  if (requestStatus === "completed") {
    return {
      label: "Loan Closed",
      hint: "This loan has been fully repaid and closed.",
      tone: "success",
    };
  }

  return {
    label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
    hint: "This reflects the current workflow state for your view.",
    tone: statusTone,
  };
}
```

- [ ] **Step 2: Add `buildLoanWorkflow()` to `request-helpers.ts`**

Add after `buildLeaveWorkflow`:

```ts
export function buildLoanWorkflow(
  request: any,
  pendingSteps: Array<{ step: string }>,
  paymentVouchers: Array<{ amount?: number }>,
  options?: { showDraftStep?: boolean },
): WorkflowStep[] {
  const status = deriveRequestWorkflowStatus(request);
  const stateEvents = Array.isArray(request?.data?.state_events)
    ? request.data.state_events
    : [];
  const doneEntries = Array.isArray(request?.approvals?.done)
    ? request.approvals.done
    : [];
  const requestTypeSteps = Array.isArray(
    request?.request_type?.approval_flow_json?.steps,
  )
    ? request.request_type.approval_flow_json.steps
    : [];
  const approvalStepsSource = requestTypeSteps.length
    ? requestTypeSteps
    : [{ role: "team_lead" }, { role: "accountant" }];
  const approvalLabels = approvalStepsSource.map(
    (step: Record<string, any>, index: number) => normalizeWorkflowLabel(step, index),
  );
  const disbursedTotal = paymentVouchers.reduce(
    (sum, v) => sum + Number(v.amount || 0),
    0,
  );
  const approvalDoneCount = Math.min(doneEntries.length, approvalLabels.length);
  const approvalCurrentIndex =
    pendingSteps.length > 0
      ? Math.min(approvalDoneCount, Math.max(0, approvalLabels.length - 1))
      : -1;
  const requestComplete = status === "completed";

  const showDraftStep = options?.showDraftStep ?? true;
  const draftStep: WorkflowStep[] = showDraftStep
    ? [
        {
          label: "Drafted",
          detail: "Loan request initialized and saved.",
          status:
            status === "draft" && approvalDoneCount === 0 && disbursedTotal === 0
              ? "current"
              : "complete",
        },
      ]
    : [];

  const approvalSteps: WorkflowStep[] = approvalLabels.map(
    (label: string, index: number) => {
      const done =
        index < approvalDoneCount ||
        requestComplete ||
        ["cleared", "disbursed", "confirmed", "retired"].includes(status);
      const isCurrent =
        approvalCurrentIndex === index &&
        ["approval", "sent", "under_review", "review"].includes(status);
      return {
        label,
        detail: isCurrent
          ? `Waiting on ${label}.`
          : done
            ? `${label} completed.`
            : `Awaiting ${label}.`,
        status: done && !isCurrent ? "complete" : isCurrent ? "current" : "upcoming",
      } satisfies WorkflowStep;
    },
  );

  const disbursedStep: WorkflowStep = {
    label: "Disbursed",
    detail:
      disbursedTotal > 0
        ? `${formatCurrency(disbursedTotal, request?.currency)} disbursed.`
        : "Loan amount issued by finance.",
    status:
      ["disbursed", "confirmed", "retired", "completed"].includes(status)
        ? "complete"
        : status === "cleared" ||
            (status === "disbursed" && disbursedTotal === 0)
          ? "current"
          : "upcoming",
  };

  const activeStep: WorkflowStep = {
    label: "Active",
    detail: "Loan is active. Repayments deducted via payroll.",
    status:
      status === "completed"
        ? "complete"
        : ["confirmed", "retired"].includes(status)
          ? "current"
          : "upcoming",
  };

  const completedStep: WorkflowStep = {
    label: "Completed",
    detail: "Loan fully repaid and closed.",
    status: requestComplete ? "complete" : "upcoming",
  };

  const steps = [...draftStep, ...approvalSteps, disbursedStep, activeStep, completedStep];

  let currentMarked = false;
  return steps.map((step) => {
    if (step.status !== "upcoming") return step;
    if (!currentMarked && !requestComplete) {
      currentMarked = true;
      return { ...step, status: "current" as const };
    }
    return step;
  });
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "loanStatus\|buildLoanWorkflow" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/requests/status/loanStatus.ts apps/pwa/src/pages/requests/request-helpers.ts
git commit -m "feat(requests): add buildLoanViewerStatus and buildLoanWorkflow"
```

---

## Task 9 — Phase 2: `LoanRequestBody.tsx`

**Files:**
- Create: `apps/pwa/src/pages/requests/bodies/LoanRequestBody.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { SectionCard } from "@/shared";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";

type Props = {
  requestData: Record<string, any>;
  organizationName: string;
  teamName: string;
  requestTotal: number;
  currency?: string | null;
};

export function LoanRequestBody({
  requestData,
  organizationName,
  teamName,
  requestTotal,
  currency,
}: Props) {
  const loanType = String(requestData.loan_type || "loan");
  const repaymentMonths = Number(requestData.repayment_months || 0);
  const monthlyAmount = Number(requestData.monthly_recovery_amount || 0) ||
    (repaymentMonths > 0 ? requestTotal / repaymentMonths : 0);
  const startDate = String(requestData.start_recovery_date || "");
  const purpose = String(requestData.purpose || "");

  return (
    <SectionCard title="Loan Details">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan Type</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {loanType === "salary_advance" ? "Salary Advance" : "Staff Loan"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal Amount</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(requestTotal, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repayment Period</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {repaymentMonths} month{repaymentMonths !== 1 ? "s" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Recovery</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(monthlyAmount, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recovery Start Date</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatDisplayDate(startDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{organizationName || "—"}</dd>
        </div>
        {teamName && teamName !== "-" ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team / Group</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{teamName}</dd>
          </div>
        ) : null}
      </dl>
      {purpose ? (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</dt>
          <dd className="mt-2 text-sm leading-6 text-slate-700">{purpose}</dd>
        </div>
      ) : null}
    </SectionCard>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "LoanRequestBody" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/requests/bodies/LoanRequestBody.tsx
git commit -m "feat(requests): add LoanRequestBody component"
```

---

## Task 10 — Phase 2: `LoanRequestDetail.tsx` + wire routing

**Files:**
- Create: `apps/pwa/src/pages/requests/details/LoanRequestDetail.tsx`
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`

- [ ] **Step 1: Create `LoanRequestDetail.tsx`**

```tsx
import { Button, SectionCard, WorkflowStepper } from "@/shared";
import { formatCurrency } from "@stanforte/shared";
import { buildLoanViewerStatus } from "../status/loanStatus";
import { buildLoanWorkflow } from "../request-helpers";

type Props = {
  request: any;
  workflowStatus: string;
  availableActions: string[];
  ownerActionsVisible: boolean;
  approvalActionsVisible: boolean;
  handlerActionsVisible: boolean;
  actionBusy: string;
  handlerRoleLabel: string;
  pendingApprovals: any[];
  statusTone: any;
  payment: { paymentVouchers: any[] | null; disbursedTotal: number; openDisburseDialog: () => void };
  detailView: string;
  canShowNudge: boolean;
  nudgeHeadline: string;
  nudgeHint: string;
  onWorkflowAction: (action: string) => void;
  onCopyNudge: () => void;
  onDownloadRequestPdf: () => void;
  onDownloadFullDocument: () => void;
  onDeleteDraft: () => void;
  isFinancePendingStep: boolean;
  canSubmit: boolean;
  requestId: string;
};

export function LoanRequestDetail({
  request,
  workflowStatus,
  availableActions,
  ownerActionsVisible,
  approvalActionsVisible,
  handlerActionsVisible,
  actionBusy,
  handlerRoleLabel,
  pendingApprovals,
  statusTone,
  payment,
  detailView,
  canShowNudge,
  nudgeHeadline,
  nudgeHint,
  onWorkflowAction,
  onCopyNudge,
  onDownloadRequestPdf,
  onDownloadFullDocument,
  onDeleteDraft,
  isFinancePendingStep,
  canSubmit,
  requestId,
}: Props) {
  const viewerStatus = buildLoanViewerStatus({
    approvalActionsVisible,
    ownerActionsVisible,
    handlerActionsVisible,
    requestStatus: workflowStatus,
    workflowStatus,
    availableActions,
    pendingStep: pendingApprovals[0]?.step,
    statusTone,
    handlerRoleLabel,
  });

  const workflow = buildLoanWorkflow(
    request,
    pendingApprovals,
    payment.paymentVouchers ?? [],
    { showDraftStep: detailView === "mine" && workflowStatus === "draft" },
  );

  return (
    <>
      {/* Summary card */}
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
          Principal Amount
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-[1.65rem] font-semibold tracking-tight">
            {formatCurrency(request.total_amount, request.currency)}
          </h3>
          {payment.disbursedTotal > 0 ? (
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
              / {formatCurrency(payment.disbursedTotal, request.currency)} disbursed
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-white/85">
          Repayments are deducted via payroll after disbursement confirmation.
        </p>
      </section>

      {/* Status For You card */}
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
          Status For You
        </p>
        <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
          {viewerStatus.label}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{viewerStatus.hint}</p>

        {/* Approver actions */}
        {!isFinancePendingStep && approvalActionsVisible ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" className="w-full justify-center"
                onClick={() => onWorkflowAction("approve")} disabled={actionBusy !== ""}>
                {actionBusy === "approve" ? "Approving..." : "Approve"}
              </Button>
              <Button variant="danger" className="w-full justify-center"
                onClick={() => onWorkflowAction("reject")} disabled={actionBusy !== ""}>
                {actionBusy === "reject" ? "Rejecting..." : "Reject"}
              </Button>
              {availableActions.includes("return") ? (
                <Button variant="secondary" className="w-full justify-center"
                  onClick={() => onWorkflowAction("return")} disabled={actionBusy !== ""}>
                  {actionBusy === "return" ? "Returning..." : "Return for Edit"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Staff submit */}
        {ownerActionsVisible && canSubmit ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => onWorkflowAction("submit")} disabled={actionBusy !== ""}>
            {actionBusy === "submit" ? "Submitting..." : workflowStatus === "returned" ? "Resubmit Request" : "Submit Request"}
          </Button>
        ) : null}

        {/* Handler: disburse */}
        {handlerActionsVisible &&
          (workflowStatus === "cleared" ||
            (workflowStatus === "disbursed" && request.total_amount > payment.disbursedTotal)) ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => payment.openDisburseDialog()} disabled={actionBusy !== ""}>
            {actionBusy === "disburse" ? "Disbursing..." : "Disburse Loan"}
          </Button>
        ) : null}

        {/* Staff: confirm receipt */}
        {ownerActionsVisible && availableActions.includes("confirm") ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => onWorkflowAction("confirm")} disabled={actionBusy !== ""}>
            {actionBusy === "confirm" ? "Confirming..." : "Confirm Loan Receipt"}
          </Button>
        ) : null}

        {/* NO retire button — loans do not retire */}
        {/* NO complete button — loans do not complete via finance */}
      </section>

      {/* Downloads */}
      <SectionCard title="Downloads & Draft">
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-between"
            onClick={onDownloadRequestPdf} disabled={actionBusy !== ""}>
            Download Request PDF
          </Button>
          {workflowStatus === "draft" ? (
            <Button variant="danger" className="w-full justify-center"
              onClick={onDeleteDraft} disabled={actionBusy !== ""}>
              {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
            </Button>
          ) : null}
        </div>
      </SectionCard>

      {/* Nudge */}
      {canShowNudge ? (
        <section className="section-card p-5">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">Need a nudge?</p>
          <h3 className="mt-3 text-sm font-semibold text-slate-950">{nudgeHeadline}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            You do not have an action right now, but you can remind the next reviewer.
          </p>
          <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{nudgeHint}</div>
          <Button className="mt-4 w-full justify-center" variant="secondary" onClick={onCopyNudge}>
            Copy reminder
          </Button>
        </section>
      ) : null}

      {/* Workflow stepper */}
      <SectionCard title="Loan Workflow">
        <WorkflowStepper steps={workflow} />
      </SectionCard>
    </>
  );
}
```

- [ ] **Step 2: Wire loan routing in `RequestDetailsPage.tsx`**

Import `LoanRequestBody` and `LoanRequestDetail` at the top:

```ts
import { LoanRequestBody } from "./bodies/LoanRequestBody";
import { LoanRequestDetail } from "./details/LoanRequestDetail";
```

In the body section (desktop), replace the existing `family === "hr"` block:

```tsx
{workflowType === "leave" ? (
  <LeaveRequestBody requestData={requestData} handoverColleagueName={handoverColleagueName} />
) : workflowType === "loan" ? (
  <LoanRequestBody
    requestData={requestData}
    organizationName={organizationName}
    teamName={teamName}
    requestTotal={requestTotal}
    currency={request.currency}
  />
) : (
  <PaymentRequestBody ... />
)}
```

In the right-rail, replace the existing right-rail section with a conditional:

```tsx
{workflowType === "loan" ? (
  <LoanRequestDetail
    request={request}
    workflowStatus={workflowStatus}
    availableActions={availableActions}
    ownerActionsVisible={ownerActionsVisible}
    approvalActionsVisible={approvalActionsVisible}
    handlerActionsVisible={handlerActionsVisible}
    actionBusy={actionBusy}
    handlerRoleLabel={handlerRoleLabel}
    pendingApprovals={pendingApprovals}
    statusTone={statusTone}
    payment={payment}
    detailView={detailView}
    canShowNudge={canShowNudge}
    nudgeHeadline={nudgeHeadline}
    nudgeHint={viewerStatus.hint}
    onWorkflowAction={(action) => void handleWorkflowAction(action as any)}
    onCopyNudge={() => void copyNudge()}
    onDownloadRequestPdf={() => void handleDownloadArtifact("request_pdf")}
    onDownloadFullDocument={() => void handleDownloadArtifact("full_document")}
    onDeleteDraft={() => void handleDeleteDraft()}
    isFinancePendingStep={isFinancePendingStep}
    canSubmit={canSubmit}
    requestId={id}
  />
) : (
  /* existing right-rail JSX unchanged */
)}
```

Apply the same pattern to the mobile layout section.

- [ ] **Step 3: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep -E "LoanRequest|loanStatus" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit Phase 2**

```bash
git add apps/pwa/src/pages/requests/details/LoanRequestDetail.tsx apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "feat(requests): Phase 2 — loan request isolation (LoanRequestDetail, LoanRequestBody, buildLoanWorkflow)"
```

---

## Task 11 — Phase 3: `RequestDetailsContext`

**Files:**
- Create: `apps/pwa/src/pages/requests/details/context.ts`

- [ ] **Step 1: Create the context**

```ts
import { createContext, useContext } from "react";
import type { WorkflowType } from "../request-helpers";
import type { UsePaymentRequestResult } from "../hooks/usePaymentRequest";
import type { PaymentProgress } from "../status/types";

export type RequestDetailsContextValue = {
  request: any;
  workflowType: WorkflowType;
  handlerRoleLabel: string;
  workflowStatus: string;
  requestStatus: string;
  availableActions: string[];
  pendingApprovals: any[];
  completedApprovals: any[];
  ownerActionsVisible: boolean;
  approvalActionsVisible: boolean;
  handlerActionsVisible: boolean;
  isFinancePendingStep: boolean;
  canSubmit: boolean;
  actionBusy: string;
  statusTone: any;
  roles: string[];
  permissions: string[];
  requestTotal: number;
  detailView: string;
  canShowNudge: boolean;
  nudgeHeadline: string;
  payment: UsePaymentRequestResult;
  paymentProgress: PaymentProgress;
  onWorkflowAction: (action: "submit" | "approve" | "reject" | "return" | "disburse" | "confirm" | "retire" | "complete") => Promise<void>;
  onDownloadArtifact: (action: "request_pdf" | "full_document" | "pv_pdf", voucherId?: string) => Promise<void>;
  onDeleteDraft: () => Promise<void>;
  onCopyNudge: () => Promise<void>;
};

export const RequestDetailsContext = createContext<RequestDetailsContextValue | null>(null);

export function useRequestDetails(): RequestDetailsContextValue {
  const ctx = useContext(RequestDetailsContext);
  if (!ctx) throw new Error("useRequestDetails must be used inside RequestDetailsPage");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/requests/details/context.ts
git commit -m "feat(requests): add RequestDetailsContext for Phase 3 routing"
```

---

## Task 12 — Phase 3: Shared section components

**Files:**
- Create: `apps/pwa/src/pages/requests/details/shared/WorkflowStepperCard.tsx`
- Create: `apps/pwa/src/pages/requests/details/shared/DownloadsSection.tsx`
- Create: `apps/pwa/src/pages/requests/details/shared/NudgeSection.tsx`
- Create: `apps/pwa/src/pages/requests/details/shared/ActivitySection.tsx`

- [ ] **Step 1: Create `WorkflowStepperCard.tsx`**

```tsx
import { SectionCard, WorkflowStepper, type WorkflowStep } from "@/shared";

type Props = {
  title?: string;
  steps: WorkflowStep[];
};

export function WorkflowStepperCard({ title = "Approval Workflow", steps }: Props) {
  return (
    <SectionCard title={title}>
      <WorkflowStepper steps={steps} />
    </SectionCard>
  );
}
```

- [ ] **Step 2: Create `DownloadsSection.tsx`**

```tsx
import { Button, SectionCard } from "@/shared";
import { useRequestDetails } from "../context";

type Props = {
  includeFullDocument?: boolean;
};

export function DownloadsSection({ includeFullDocument = true }: Props) {
  const { workflowStatus, actionBusy, onDownloadArtifact, onDeleteDraft } = useRequestDetails();

  return (
    <SectionCard title="Downloads & Draft">
      <div className="space-y-3">
        <Button
          variant="secondary"
          className="w-full justify-between"
          onClick={() => void onDownloadArtifact("request_pdf")}
          disabled={actionBusy !== ""}
        >
          Download Request PDF
        </Button>
        {includeFullDocument ? (
          <Button
            variant="secondary"
            className="w-full justify-between"
            onClick={() => void onDownloadArtifact("full_document")}
            disabled={actionBusy !== ""}
          >
            Download Full Document
          </Button>
        ) : null}
        {workflowStatus === "draft" ? (
          <Button
            variant="danger"
            className="w-full justify-center"
            onClick={() => void onDeleteDraft()}
            disabled={actionBusy !== ""}
          >
            {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Create `NudgeSection.tsx`**

```tsx
import { Button } from "@/shared";
import { useRequestDetails } from "../context";

export function NudgeSection() {
  const { canShowNudge, nudgeHeadline, payment: _p, onCopyNudge, request, availableActions, pendingApprovals } = useRequestDetails();

  if (!canShowNudge) return null;

  const hint = pendingApprovals[0]?.step
    ? `Waiting on ${pendingApprovals[0].step}`
    : "Request waiting on review";

  return (
    <section className="section-card p-5">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">Need a nudge?</p>
      <h3 className="mt-3 text-sm font-semibold text-slate-950">{nudgeHeadline}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        You do not have an action right now, but you can remind the next reviewer to move this forward.
      </p>
      <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{hint}</div>
      <Button className="mt-4 w-full justify-center" variant="secondary" onClick={() => void onCopyNudge()}>
        Copy reminder
      </Button>
    </section>
  );
}
```

- [ ] **Step 4: Create `ActivitySection.tsx`**

```tsx
import { ActivityFeed, SectionCard } from "@/shared";

type ActivityItem = {
  title: string;
  description: string;
  time: string;
  tone: "neutral" | "success" | "warning" | "pending" | "danger";
  icon: string;
};

type Props = {
  items: ActivityItem[];
};

export function ActivitySection({ items }: Props) {
  return (
    <SectionCard title="Activity">
      <ActivityFeed
        items={items}
        emptyState="No activity recorded for this request yet."
        limit={3}
      />
    </SectionCard>
  );
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "details/shared" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/requests/details/shared/
git commit -m "feat(requests): add shared detail section components for Phase 3"
```

---

## Task 13 — Phase 3: `PaymentRequestDetail`, `LeaveRequestDetail`, `OtherRequestDetail`

**Files:**
- Create: `apps/pwa/src/pages/requests/details/PaymentRequestDetail.tsx`
- Create: `apps/pwa/src/pages/requests/details/LeaveRequestDetail.tsx`
- Create: `apps/pwa/src/pages/requests/details/OtherRequestDetail.tsx`

- [ ] **Step 1: Create `PaymentRequestDetail.tsx`**

This is the right-rail extracted from the existing `RequestDetailsPage.tsx` right-rail JSX for non-loan, non-leave requests. Pull the entire right-rail JSX block (the `<RightRail>` content for the non-loan path from Task 10) into this component, using `useRequestDetails()` for all data.

```tsx
import { Button, Link, SectionCard } from "@/shared";
import { formatCurrency } from "@stanforte/shared";
import { useRequestDetails } from "./context";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { DownloadsSection } from "./shared/DownloadsSection";
import { NudgeSection } from "./shared/NudgeSection";
import { buildWorkflow } from "../request-helpers";
import { buildPaymentViewerStatus } from "../status/paymentStatus";

export function PaymentRequestDetail() {
  const {
    request,
    workflowType,
    handlerRoleLabel,
    workflowStatus,
    requestStatus,
    availableActions,
    pendingApprovals,
    ownerActionsVisible,
    approvalActionsVisible,
    handlerActionsVisible,
    isFinancePendingStep,
    canSubmit,
    actionBusy,
    statusTone,
    roles,
    permissions,
    requestTotal,
    payment,
    paymentProgress,
    onWorkflowAction,
  } = useRequestDetails();

  const viewerStatus = buildPaymentViewerStatus({
    approvalActionsVisible,
    ownerActionsVisible,
    handlerActionsVisible,
    requestStatus,
    workflowStatus,
    availableActions,
    pendingStep: pendingApprovals[0]?.step,
    roles,
    permissions,
    statusTone,
    workflowType,
    handlerRoleLabel,
  });

  const workflow = buildWorkflow(
    request,
    pendingApprovals,
    payment.paymentVouchers ?? [],
  );

  const disbursementButtonLabel =
    requestStatus === "disbursed" &&
      requestTotal > 0 &&
      payment.disbursedTotal < requestTotal
      ? "Disburse More"
      : "Disburse Request";

  return (
    <>
      {/* Total card */}
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Current Total</p>
        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-[1.65rem] font-semibold tracking-tight">
            {formatCurrency(request.total_amount, request.currency)}
          </h3>
          {payment.disbursedTotal > 0 ? (
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
              / {formatCurrency(payment.disbursedTotal, request.currency)} disbursed
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-white/85">
          This total is calculated from the submitted request items and their supporting attachments.
        </p>
      </section>

      {/* Status For You card */}
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Status For You</p>
        <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
          {viewerStatus.label}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{viewerStatus.hint}</p>

        {handlerActionsVisible && paymentProgress.label ? (
          <div className="mt-4 rounded-[18px] bg-white/10 px-4 py-3">
            <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/60">Payment Progress</div>
            <div className="mt-1 text-sm font-semibold text-white">{paymentProgress.label}</div>
            <div className="mt-1 text-sm leading-6 text-white/75">{paymentProgress.hint}</div>
          </div>
        ) : null}

        {!isFinancePendingStep && approvalActionsVisible ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" className="w-full justify-center"
                onClick={() => void onWorkflowAction("approve")} disabled={actionBusy !== ""}>
                {actionBusy === "approve" ? (handlerActionsVisible ? "Clearing..." : "Approving...") : handlerActionsVisible ? "Clear Request" : "Approve"}
              </Button>
              <Button variant="danger" className="w-full justify-center"
                onClick={() => void onWorkflowAction("reject")} disabled={actionBusy !== ""}>
                {actionBusy === "reject" ? "Rejecting..." : "Reject"}
              </Button>
              {availableActions.includes("return") ? (
                <Button variant="secondary" className="w-full justify-center"
                  onClick={() => void onWorkflowAction("return")} disabled={actionBusy !== ""}>
                  {actionBusy === "return" ? "Returning..." : "Return for Edit"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {isFinancePendingStep && approvalActionsVisible ? (
          <p className="mt-4 text-sm text-white/75">
            This step requires {handlerRoleLabel} clearance.{" "}
            <Link to={`/finance/requests/${request.id}`} className="font-medium text-white underline">
              Open in {handlerRoleLabel} Portal
            </Link>
          </p>
        ) : null}

        {ownerActionsVisible && canSubmit ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => void onWorkflowAction("submit")} disabled={actionBusy !== ""}>
            {actionBusy === "submit" ? "Submitting..." : workflowStatus === "returned" ? "Resubmit Request" : "Submit Request"}
          </Button>
        ) : null}

        {handlerActionsVisible &&
          (requestStatus === "cleared" ||
            (requestStatus === "disbursed" && requestTotal > payment.disbursedTotal)) ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => payment.openDisburseDialog()} disabled={actionBusy !== ""}>
            {actionBusy === "disburse" ? "Disbursing..." : disbursementButtonLabel}
          </Button>
        ) : null}

        {ownerActionsVisible && availableActions.includes("confirm") ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => void onWorkflowAction("confirm")} disabled={actionBusy !== ""}>
            {actionBusy === "confirm" ? "Confirming..." : "Confirm Receipt"}
          </Button>
        ) : null}

        {ownerActionsVisible && availableActions.includes("retire") ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => payment.openRetireDialog()} disabled={actionBusy !== ""}>
            {actionBusy === "retire" ? "Preparing..." : "Retire"}
          </Button>
        ) : null}

        {handlerActionsVisible && availableActions.includes("complete") ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => void onWorkflowAction("complete")} disabled={actionBusy !== ""}>
            {actionBusy === "complete" ? "Completing..." : "Complete Request"}
          </Button>
        ) : null}
      </section>

      <DownloadsSection includeFullDocument={true} />
      <NudgeSection />
      <WorkflowStepperCard steps={workflow} />
    </>
  );
}
```

- [ ] **Step 2: Create `LeaveRequestDetail.tsx`**

```tsx
import { Button, SectionCard } from "@/shared";
import { useRequestDetails } from "./context";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { DownloadsSection } from "./shared/DownloadsSection";
import { NudgeSection } from "./shared/NudgeSection";
import { buildLeaveWorkflow, requestHasDraftHistory } from "../request-helpers";
import { buildLeaveViewerStatus } from "../status/leaveStatus";

export function LeaveRequestDetail() {
  const {
    request,
    workflowStatus,
    requestStatus,
    availableActions,
    pendingApprovals,
    ownerActionsVisible,
    approvalActionsVisible,
    isFinancePendingStep,
    canSubmit,
    actionBusy,
    statusTone,
    detailView,
    onWorkflowAction,
  } = useRequestDetails();

  const viewerStatus = buildLeaveViewerStatus({
    approvalActionsVisible,
    ownerActionsVisible,
    requestStatus,
    workflowStatus,
    availableActions,
    pendingStep: pendingApprovals[0]?.step,
    statusTone,
  });

  const workflow = buildLeaveWorkflow(request, pendingApprovals, {
    showDraftStep:
      detailView === "mine" &&
      workflowStatus === "draft" &&
      requestHasDraftHistory(request),
  });

  return (
    <>
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Request Type</p>
        <h3 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
          {request.request_type?.name || "Leave Request"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/85">
          This request follows the leave workflow and approval sequence.
        </p>
      </section>

      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Status For You</p>
        <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
          {viewerStatus.label}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{viewerStatus.hint}</p>

        {!isFinancePendingStep && approvalActionsVisible ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" className="w-full justify-center"
              onClick={() => void onWorkflowAction("approve")} disabled={actionBusy !== ""}>
              {actionBusy === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button variant="danger" className="w-full justify-center"
              onClick={() => void onWorkflowAction("reject")} disabled={actionBusy !== ""}>
              {actionBusy === "reject" ? "Rejecting..." : "Reject"}
            </Button>
            {availableActions.includes("return") ? (
              <Button variant="secondary" className="w-full justify-center"
                onClick={() => void onWorkflowAction("return")} disabled={actionBusy !== ""}>
                {actionBusy === "return" ? "Returning..." : "Return for Edit"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {ownerActionsVisible && canSubmit ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => void onWorkflowAction("submit")} disabled={actionBusy !== ""}>
            {actionBusy === "submit" ? "Submitting..." : workflowStatus === "returned" ? "Resubmit Request" : "Submit Request"}
          </Button>
        ) : null}
      </section>

      <DownloadsSection includeFullDocument={false} />
      <NudgeSection />
      <WorkflowStepperCard title="Leave Workflow" steps={workflow} />
    </>
  );
}
```

- [ ] **Step 3: Create `OtherRequestDetail.tsx`**

```tsx
import { Button, SectionCard } from "@/shared";
import { useRequestDetails } from "./context";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { DownloadsSection } from "./shared/DownloadsSection";
import { NudgeSection } from "./shared/NudgeSection";
import { buildLeaveWorkflow } from "../request-helpers";
import { buildLeaveViewerStatus } from "../status/leaveStatus";

export function OtherRequestDetail() {
  const {
    request,
    workflowStatus,
    requestStatus,
    availableActions,
    pendingApprovals,
    ownerActionsVisible,
    approvalActionsVisible,
    isFinancePendingStep,
    canSubmit,
    actionBusy,
    statusTone,
    detailView,
    onWorkflowAction,
  } = useRequestDetails();

  const viewerStatus = buildLeaveViewerStatus({
    approvalActionsVisible,
    ownerActionsVisible,
    requestStatus,
    workflowStatus,
    availableActions,
    pendingStep: pendingApprovals[0]?.step,
    statusTone,
  });

  const workflow = buildLeaveWorkflow(request, pendingApprovals);

  return (
    <>
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Request Type</p>
        <h3 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
          {request.request_type?.name || "Request"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/85">
          This request follows the standard approval workflow.
        </p>
      </section>

      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Status For You</p>
        <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
          {viewerStatus.label}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{viewerStatus.hint}</p>

        {!isFinancePendingStep && approvalActionsVisible ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" className="w-full justify-center"
              onClick={() => void onWorkflowAction("approve")} disabled={actionBusy !== ""}>
              {actionBusy === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button variant="danger" className="w-full justify-center"
              onClick={() => void onWorkflowAction("reject")} disabled={actionBusy !== ""}>
              {actionBusy === "reject" ? "Rejecting..." : "Reject"}
            </Button>
            {availableActions.includes("return") ? (
              <Button variant="secondary" className="w-full justify-center"
                onClick={() => void onWorkflowAction("return")} disabled={actionBusy !== ""}>
                {actionBusy === "return" ? "Returning..." : "Return for Edit"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {ownerActionsVisible && canSubmit ? (
          <Button variant="secondary" className="mt-4 w-full justify-center"
            onClick={() => void onWorkflowAction("submit")} disabled={actionBusy !== ""}>
            {actionBusy === "submit" ? "Submitting..." : workflowStatus === "returned" ? "Resubmit" : "Submit Request"}
          </Button>
        ) : null}
      </section>

      <DownloadsSection includeFullDocument={false} />
      <NudgeSection />
      <WorkflowStepperCard steps={workflow} />
    </>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
pnpm --filter pwa tsc --noEmit 2>&1 | grep "RequestDetail\." | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/requests/details/
git commit -m "feat(requests): add PaymentRequestDetail, LeaveRequestDetail, OtherRequestDetail"
```

---

## Task 14 — Phase 3: Wire context + full routing in `RequestDetailsPage.tsx`; gate `usePaymentRequest`

**Files:**
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`
- Modify: `apps/pwa/src/pages/requests/hooks/usePaymentRequest.ts`

- [ ] **Step 1: Gate `usePaymentRequest` for non-payment/loan types**

In `RequestDetailsPage.tsx`, update the `usePaymentRequest` call:

```ts
const payment = usePaymentRequest(id, requestTotal, availableActions, {
  skip: workflowType !== "payment" && workflowType !== "loan",
});
```

Note: `workflowType` is derived before this call so the value is available. Since hooks can't be conditional, the `skip` flag tells the hook to resolve empty without hitting the network.

- [ ] **Step 2: Import context and detail views**

```ts
import { RequestDetailsContext } from "./details/context";
import { PaymentRequestDetail } from "./details/PaymentRequestDetail";
import { LeaveRequestDetail } from "./details/LeaveRequestDetail";
import { OtherRequestDetail } from "./details/OtherRequestDetail";
```

- [ ] **Step 3: Build context value object**

Inside the component, after all derived values are computed, build:

```ts
const detailsContextValue = {
  request,
  workflowType,
  handlerRoleLabel,
  workflowStatus,
  requestStatus: workflowStatus,
  availableActions,
  pendingApprovals,
  completedApprovals,
  ownerActionsVisible,
  approvalActionsVisible,
  handlerActionsVisible,
  isFinancePendingStep,
  canSubmit,
  actionBusy,
  statusTone,
  roles,
  permissions,
  requestTotal,
  detailView,
  canShowNudge,
  nudgeHeadline,
  payment,
  paymentProgress,
  onWorkflowAction: handleWorkflowAction,
  onDownloadArtifact: handleDownloadArtifact,
  onDeleteDraft: handleDeleteDraft,
  onCopyNudge: copyNudge,
};
```

- [ ] **Step 4: Wrap right-rail content in context provider and route to detail views**

In the desktop layout's `<RightRail>`, replace the entire right-rail JSX (status card, buttons, downloads, stepper) with:

```tsx
<RequestDetailsContext.Provider value={detailsContextValue}>
  <RightRail className="lg:col-span-4">
    {workflowType === "loan" ? (
      <LoanRequestDetail ... /> // already wired in Task 10; now passes through context
    ) : workflowType === "leave" ? (
      <LeaveRequestDetail />
    ) : workflowType === "payment" ? (
      <PaymentRequestDetail />
    ) : (
      <OtherRequestDetail />
    )}
  </RightRail>
</RequestDetailsContext.Provider>
```

At this point `LoanRequestDetail` can also be refactored to read from context (optional cleanup — if keeping the prop-passing from Task 10, it still works).

Apply the same routing in the mobile layout.

- [ ] **Step 5: Remove all right-rail JSX that was moved into detail views**

The `RequestDetailsPage.tsx` right-rail section should now contain only the context provider + routing switch. Delete the old status card, action buttons, downloads section, stepper JSX that was previously inline.

- [ ] **Step 6: Full type-check**

```bash
pnpm --filter pwa tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Grep for stray old identifiers**

```bash
grep -rn "RequestFamily\|classifyRequestFamily\|financeActionsVisible\|buildFinanceViewerStatus\|buildFinanceProgress\|useFinanceRequest\|FinanceRequestBody\|FinancialRequest\|detailView.*finance\|detailView.*\"hr\"" apps/pwa/src/pages/requests/
```

Expected: no output.

- [ ] **Step 8: Commit Phase 3**

```bash
git add apps/pwa/src/pages/requests/
git commit -m "feat(requests): Phase 3 — context routing, gate usePaymentRequest, full WorkflowType dispatch"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| `workflow_type` + `handler_role_label` on RequestType (backend) | Task 1 |
| `WorkflowType` replaces `RequestFamily`; all function renames | Task 2 |
| `paymentStatus.ts`, `PaymentProgress` | Task 3 |
| `usePaymentRequest` with `skip` | Task 3 |
| `PaymentRequestFormPage` rename | Task 4 |
| `PaymentRequestBody/` folder | Task 4 |
| `RequestFormPage` updated | Task 5 |
| `RequestDetailsPage` Phase 1 renames + `detailView` type | Task 6 |
| Admin UI new fields | Task 7 |
| `buildLoanViewerStatus`, `loanStatus.ts` | Task 8 |
| `buildLoanWorkflow` | Task 8 |
| `LoanRequestBody` | Task 9 |
| `LoanRequestDetail` (no retire/complete) | Task 10 |
| Loan routing in `RequestDetailsPage` | Task 10 |
| `RequestDetailsContext` | Task 11 |
| Shared section components | Task 12 |
| `PaymentRequestDetail` | Task 13 |
| `LeaveRequestDetail` | Task 13 |
| `OtherRequestDetail` | Task 13 |
| Full context routing + `usePaymentRequest` gating | Task 14 |
| `classifyRequestCategory()` rename | Task 2 ✓ |
| handler role label in status hints | Tasks 3, 8 ✓ |
| Responsive (no desktop/mobile split) | Phase 4 — separate PR |
| Dialog decomposition | Phase 4 — separate PR |

**All spec requirements covered within Phase 1-3 scope.**
