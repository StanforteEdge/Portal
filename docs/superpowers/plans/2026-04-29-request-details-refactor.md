# RequestDetailsPage Refactor — Family Body Pattern

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break `RequestDetailsPage.tsx` (3,752 lines) into a wrapper + per-family body components so new request families only require adding a new body file.

**Architecture:** Extract a `useFinanceRequest` hook for all finance-specific state/queries/handlers. Create `LeaveRequestBody` (pure display) and `FinanceRequestBody` (finance sections + all finance modals). The wrapper renders the appropriate body based on `family` and passes shared state down. The right rail stays in the wrapper — finance-specific right rail bits are driven by values from the hook.

**Tech Stack:** React 18, TypeScript, TailwindCSS, existing shared UI components (`SectionCard`, `StatCard`, `Table`, `Button`, etc.), `useCachedQuery`, `financeApi`

---

## File Structure

```
apps/pwa/src/pages/requests/
├── RequestDetailsPage.tsx          ← Modify: remove extracted code, render bodies
├── request-helpers.ts              ← Modify: add buildWorkflow, buildLeaveWorkflow, deriveRequestWorkflowStatus, requestHasDraftHistory
├── hooks/
│   └── useFinanceRequest.ts        ← Create: all finance state, queries, computed, handlers
└── bodies/
    ├── LeaveRequestBody.tsx        ← Create: leave-specific sections (desktop + mobile)
    └── FinanceRequestBody.tsx      ← Create: finance sections + all finance modals
```

**Rule going forward:** A new request family = a new file in `bodies/`. No changes to the wrapper.

---

## Task 1: Move pure workflow functions to `request-helpers.ts`

**Files:**
- Modify: `apps/pwa/src/pages/requests/request-helpers.ts`
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` (remove moved functions, add imports)

These functions are currently at the top of `RequestDetailsPage.tsx` but are pure utilities with no component dependencies:
- `normalizeWorkflowLabel` (line 70)
- `buildWorkflow` (line 103)
- `buildLeaveWorkflow` (line 263)
- `deriveRequestWorkflowStatus` (line 336)
- `requestHasDraftHistory` (line 398)

- [ ] **Step 1: Append the five functions to `request-helpers.ts`**

Open `apps/pwa/src/pages/requests/request-helpers.ts` and add at the bottom:

```typescript
import type { WorkflowStep, WorkflowStepStatus } from "@/shared";

export function normalizeWorkflowLabel(step: Record<string, any>, index: number): string {
  const role = String(step.role || step.approver?.value || step.approver_id || "").toLowerCase();
  const approverType = String(step.approver?.type || step.approver_type || "").toLowerCase();
  if (role.includes("team_lead_or_manager") || step.approver?.value === "requester_team_lead_or_manager") {
    return index === 0 ? "Team Lead Approval" : "Manager Approval";
  }
  if (role.includes("team_lead") || step.approver?.value === "requester_team_lead") return "Team Lead Approval";
  if (role.includes("accountant") || step.approver?.value === "finance.approve" || approverType === "permission") return "Accountant Clears";
  if (role.includes("hr")) return "HR Approval";
  if (role.includes("coo")) return "COO Approval";
  if (role.includes("ed")) return "ED Approval";
  if (role.includes("board")) return "Board Member Approval";
  return String(step.step || step.name || `Approval ${index + 1}`);
}

export function deriveRequestWorkflowStatus(request: any): string {
  // Copy verbatim from RequestDetailsPage.tsx line 336–397
}

export function requestHasDraftHistory(request: any): boolean {
  // Copy verbatim from RequestDetailsPage.tsx line 398–408
}

export function buildWorkflow(
  request: any,
  pendingApprovals: any[],
  paymentVouchers: any[],
  options: { showDraftStep: boolean }
): WorkflowStep[] {
  // Copy verbatim from RequestDetailsPage.tsx line 103–262
}

export function buildLeaveWorkflow(
  request: any,
  pendingApprovals: any[],
  options: { showDraftStep: boolean }
): WorkflowStep[] {
  // Copy verbatim from RequestDetailsPage.tsx line 263–335
}
```

> **Note:** Copy the function bodies verbatim — do not rewrite. The goal is a move, not a rewrite.

- [ ] **Step 2: Update imports in `RequestDetailsPage.tsx`**

Add to the existing import from `./request-helpers`:
```typescript
import {
  // existing imports...
  buildWorkflow,
  buildLeaveWorkflow,
  deriveRequestWorkflowStatus,
  requestHasDraftHistory,
} from "@/pages/requests/request-helpers";
```

Delete the five function declarations from `RequestDetailsPage.tsx` (lines 70–408). The `normalizeWorkflowLabel` is only used inside `buildWorkflow`/`buildLeaveWorkflow` — delete it from the page file once it's in `request-helpers.ts`.

- [ ] **Step 3: Verify the page still compiles**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep -i "request"
```

Expected: no errors related to `RequestDetailsPage` or `request-helpers`.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/requests/request-helpers.ts \
        apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "refactor(requests): move workflow builder functions to request-helpers"
```

---

## Task 2: Create `useFinanceRequest` hook

**Files:**
- Create: `apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts`

This hook owns all finance-specific state, queries, computed values, and dialog handlers. The wrapper calls it and passes the result to `FinanceRequestBody` and the right rail.

- [ ] **Step 1: Create the hook file**

Create `apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts`:

```typescript
import { useEffect, useMemo, useState } from "react";
import { useCachedQuery, financeApi } from "@/shared/lib/core";
import type { FinancePaymentVoucherRecord } from "@/shared";

type DisburseForm = {
  amount: string;
  method: string;
  transaction_ref: string;
  paid_from_account_id: string;
  note: string;
  disbursed_at: string;
};

type RetireForm = {
  voucher_id: string;
  retired_amount: string;
  notes: string;
  retirement_file_ids: string[];
  refund_amount: string;
  refund_method: string;
  refund_reference: string;
  refund_date: string;
};

type CertificateForm = {
  declaration: string;
  reason: string;
};

export type UseFinanceRequestResult = {
  // Queries
  financeAccounts: any[] | null;
  paymentVouchers: FinancePaymentVoucherRecord[] | null;
  refetchPaymentVouchers: () => void;
  // Computed
  disbursedTotal: number;
  retiredTotal: number;
  remainingDisbursement: number;
  defaultFinanceAccountId: string;
  // Disburse dialog
  showDisburseDialog: boolean;
  disburseMode: "create" | "edit";
  editingVoucherId: string;
  disburseForm: DisburseForm;
  setDisburseForm: React.Dispatch<React.SetStateAction<DisburseForm>>;
  disburseFiles: Array<{ id: string; file_name: string }>;
  setDisburseFiles: React.Dispatch<React.SetStateAction<Array<{ id: string; file_name: string }>>>;
  showDisbursementMediaPicker: boolean;
  setShowDisbursementMediaPicker: React.Dispatch<React.SetStateAction<boolean>>;
  openDisburseDialog: () => void;
  openVoucherEditor: (voucher: FinancePaymentVoucherRecord) => void;
  closeDisburseDialog: () => void;
  canEditVoucher: (voucher: FinancePaymentVoucherRecord) => boolean;
  // Voucher preview
  showVoucherPreviewDialog: boolean;
  previewVoucher: FinancePaymentVoucherRecord | null;
  voucherFilePreview: { name: string; url: string; mime_type: string | null } | null;
  openVoucherPreview: (voucher: FinancePaymentVoucherRecord) => void;
  openVoucherEvidence: (file: { name: string; url: string; mime_type: string | null }) => void;
  closeVoucherPreview: () => void;
  // Retire dialog
  showRetireDialog: boolean;
  retireForm: RetireForm;
  setRetireForm: React.Dispatch<React.SetStateAction<RetireForm>>;
  showRetirementMediaPicker: boolean;
  setShowRetirementMediaPicker: React.Dispatch<React.SetStateAction<boolean>>;
  openRetireDialog: (voucher?: FinancePaymentVoucherRecord | null) => void;
  closeRetireDialog: () => void;
  // Certificate
  showCertificateHonorForm: boolean;
  setShowCertificateHonorForm: React.Dispatch<React.SetStateAction<boolean>>;
  retirementCertificateForm: CertificateForm;
  setRetirementCertificateForm: React.Dispatch<React.SetStateAction<CertificateForm>>;
};

const DEFAULT_DISBURSE_FORM: DisburseForm = {
  amount: "",
  method: "bank_transfer",
  transaction_ref: "",
  paid_from_account_id: "",
  note: "",
  disbursed_at: new Date().toISOString().slice(0, 10),
};

const DEFAULT_RETIRE_FORM: RetireForm = {
  voucher_id: "",
  retired_amount: "",
  notes: "",
  retirement_file_ids: [],
  refund_amount: "",
  refund_method: "bank_transfer",
  refund_reference: "",
  refund_date: new Date().toISOString().slice(0, 10),
};

export function useFinanceRequest(
  requestId: string,
  requestTotal: number,
  availableActions: string[],
): UseFinanceRequestResult {
  // Dialog state
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showRetireDialog, setShowRetireDialog] = useState(false);
  const [showVoucherPreviewDialog, setShowVoucherPreviewDialog] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState<FinancePaymentVoucherRecord | null>(null);
  const [voucherFilePreview, setVoucherFilePreview] = useState<{ name: string; url: string; mime_type: string | null } | null>(null);
  const [disburseMode, setDisburseMode] = useState<"create" | "edit">("create");
  const [editingVoucherId, setEditingVoucherId] = useState("");
  const [disburseForm, setDisburseForm] = useState<DisburseForm>(DEFAULT_DISBURSE_FORM);
  const [disburseFiles, setDisburseFiles] = useState<Array<{ id: string; file_name: string }>>([]);
  const [showDisbursementMediaPicker, setShowDisbursementMediaPicker] = useState(false);
  const [showRetirementMediaPicker, setShowRetirementMediaPicker] = useState(false);
  const [retireForm, setRetireForm] = useState<RetireForm>(DEFAULT_RETIRE_FORM);
  const [showCertificateHonorForm, setShowCertificateHonorForm] = useState(false);
  const [retirementCertificateForm, setRetirementCertificateForm] = useState<CertificateForm>({
    declaration: "I hereby certify that the disbursed funds referenced above were used for official purposes in line with the approved request.",
    reason: "No supporting receipt is available for the full amount because the expense was settled without a formal receipt or the receipt could not be obtained in time for retirement.",
  });

  // Queries
  const { data: financeAccounts } = useCachedQuery(
    "finance:accounts:options",
    () => financeApi.listAccounts({ is_active: true }),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );

  const { data: paymentVouchers, refetch: refetchPaymentVouchers } = useCachedQuery(
    `requests:detail:payment-vouchers:${requestId || "none"}`,
    () => (requestId ? financeApi.listRequestPaymentVouchers(requestId) : Promise.resolve([])),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  // Sync default account id into form when accounts load
  const defaultFinanceAccountId = financeAccounts?.[0]?.id ?? "";
  useEffect(() => {
    if (!showDisburseDialog) return;
    setDisburseForm((f) => ({ ...f, paid_from_account_id: f.paid_from_account_id || defaultFinanceAccountId }));
  }, [showDisburseDialog, defaultFinanceAccountId]);

  // Computed
  const disbursedTotal = useMemo(
    () => (paymentVouchers ?? []).reduce((sum, v) => sum + Number(v.amount || 0), 0),
    [paymentVouchers],
  );
  const retiredTotal = useMemo(
    () => (paymentVouchers ?? []).reduce((sum, v) => sum + Number(v.retired_amount || 0), 0),
    [paymentVouchers],
  );
  const remainingDisbursement = Math.max(0, requestTotal - disbursedTotal);

  // Dialog handlers — copy verbatim from RequestDetailsPage.tsx lines 1073–1160
  function openVoucherEditor(voucher: FinancePaymentVoucherRecord) {
    // copy from RequestDetailsPage line 1073
  }

  function canEditVoucher(voucher: FinancePaymentVoucherRecord): boolean {
    // copy from RequestDetailsPage line 1098
  }

  function openVoucherPreview(voucher: FinancePaymentVoucherRecord) {
    // copy from RequestDetailsPage line 1104
  }

  function openVoucherEvidence(file: { name: string; url: string; mime_type: string | null }) {
    // copy from RequestDetailsPage line 1109
  }

  function openRetireDialog(voucher?: FinancePaymentVoucherRecord | null) {
    // copy from RequestDetailsPage line 1130
  }

  function closeDisburseDialog() {
    setShowDisburseDialog(false);
    setDisburseMode("create");
  }

  function openDisburseDialog() {
    setShowDisburseDialog(true);
  }

  function closeRetireDialog() {
    setShowRetireDialog(false);
  }

  function closeVoucherPreview() {
    setShowVoucherPreviewDialog(false);
    setPreviewVoucher(null);
    setVoucherFilePreview(null);
  }

  return {
    financeAccounts: financeAccounts ?? null,
    paymentVouchers: paymentVouchers ?? null,
    refetchPaymentVouchers,
    disbursedTotal,
    retiredTotal,
    remainingDisbursement,
    defaultFinanceAccountId,
    showDisburseDialog,
    disburseMode,
    editingVoucherId,
    disburseForm,
    setDisburseForm,
    disburseFiles,
    setDisburseFiles,
    showDisbursementMediaPicker,
    setShowDisbursementMediaPicker,
    openDisburseDialog,
    openVoucherEditor,
    closeDisburseDialog,
    canEditVoucher,
    showVoucherPreviewDialog,
    previewVoucher,
    voucherFilePreview,
    openVoucherPreview,
    openVoucherEvidence,
    closeVoucherPreview,
    showRetireDialog,
    retireForm,
    setRetireForm,
    showRetirementMediaPicker,
    setShowRetirementMediaPicker,
    openRetireDialog,
    closeRetireDialog,
    showCertificateHonorForm,
    setShowCertificateHonorForm,
    retirementCertificateForm,
    setRetirementCertificateForm,
  };
}
```

> **Critical:** The function bodies for `openVoucherEditor`, `canEditVoucher`, `openVoucherPreview`, `openVoucherEvidence`, `openRetireDialog` must be copied verbatim from `RequestDetailsPage.tsx` lines 1073–1153. Do not rewrite them.

- [ ] **Step 2: Verify the hook compiles**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "useFinanceRequest"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/requests/hooks/useFinanceRequest.ts
git commit -m "refactor(requests): extract useFinanceRequest hook"
```

---

## Task 3: Create `LeaveRequestBody` component

**Files:**
- Create: `apps/pwa/src/pages/requests/bodies/LeaveRequestBody.tsx`

This is a pure display component — no state, no queries, no side effects. It renders the leave-specific sections for both desktop and mobile layouts.

- [ ] **Step 1: Create the file**

Create `apps/pwa/src/pages/requests/bodies/LeaveRequestBody.tsx`:

```typescript
import { SectionCard, StatCard } from "@/shared";
import { formatDisplayDate } from "@stanforte/shared";

type Props = {
  requestData: Record<string, any>;
  handoverColleagueName: string;
  // Mobile layout: Request Items section is omitted for leave (no line items)
};

export function LeaveRequestBody({ requestData, handoverColleagueName }: Props) {
  return (
    <>
      {/* Desktop: Leave Coverage section */}
      <SectionCard
        title="Leave Coverage"
        description="Leave-specific dates and handover details."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            label="Start Date"
            value={formatDisplayDate(String(requestData.start_date || ""))}
            tone="neutral"
          />
          <StatCard
            label="End Date"
            value={formatDisplayDate(String(requestData.end_date || ""))}
            tone="neutral"
          />
          <StatCard
            label="Days Requested"
            value={String(requestData.days_requested || "-")}
            tone="warning"
          />
          <StatCard
            label="Handover Colleague"
            value={handoverColleagueName}
            tone="neutral"
          />
        </div>
        <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Handover acknowledgement:{" "}
          {String(requestData.handover_ack_status || "Pending acknowledgement")}
          . Team lead/workflow approvers make the leave decision.
        </div>
        <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          {String(requestData.handover_notes || "No handover notes captured.")}
        </div>
      </SectionCard>
    </>
  );
}
```

> **Note:** The content above must match exactly what is currently rendered at lines 1838–1881 of `RequestDetailsPage.tsx`. Verify visually before committing.

- [ ] **Step 2: Verify the component compiles**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "LeaveRequestBody"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/requests/bodies/LeaveRequestBody.tsx
git commit -m "refactor(requests): create LeaveRequestBody component"
```

---

## Task 4: Create `FinanceRequestBody` component

**Files:**
- Create: `apps/pwa/src/pages/requests/bodies/FinanceRequestBody.tsx`

This renders all finance-specific body sections (desktop and mobile) plus all finance modals (disburse dialog at line 2744, voucher preview at line 2966, retire dialog at line 3323, certificate of honor at line 3568).

- [ ] **Step 1: Create the file with the prop types**

Create `apps/pwa/src/pages/requests/bodies/FinanceRequestBody.tsx` with:

```typescript
import { /* all shared UI imports needed */ } from "@/shared";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { UseFinanceRequestResult } from "../hooks/useFinanceRequest";

// Move these two functions verbatim from RequestDetailsPage.tsx:
// - formatCertificateCurrency (line 409)
// - buildCertificateOfHonorPdf (line 419)

type Props = {
  request: any;
  requestData: Record<string, any>;
  categoryName: string;
  projectName: string;
  teamName: string;
  organizationName: string;
  requestTags: Array<{ id: string; label: string }>;
  lineItems: any[];
  currentUserId: string | undefined;
  detailView: "mine" | "approvals" | "finance";
  ownerActionsVisible: boolean;
  availableActions: string[];
  actionBusy: string;
  finance: UseFinanceRequestResult;
  // Handlers that need wrapper context (showToast, setActionBusy, refetch)
  onHandleDisburse: () => Promise<void>;
  onHandleRetire: () => Promise<void>;
  onHandleVoucherSave: () => Promise<void>;
};

export function FinanceRequestBody(props: Props) {
  const { request, requestData, finance, lineItems, actionBusy, availableActions, ownerActionsVisible } = props;

  return (
    <>
      {/* Desktop: Work Context */}
      <SectionCard title="Work Context" description="The workstream and ownership context for this request.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Project" value={props.projectName} tone="neutral" />
          <StatCard label="Team" value={props.teamName} tone="neutral" />
          <StatCard label="Organization" value={props.organizationName} tone="neutral" />
        </div>
      </SectionCard>

      {/* Desktop: Request Items — copy verbatim from lines 1883–1952 */}

      {/* Desktop: Disbursements — copy verbatim from lines 1955–2084 */}

      {/* Finance modals — copy verbatim from lines 2744–3750 */}
    </>
  );
}
```

> **Implementation note:** The bulk of this file is direct copy from `RequestDetailsPage.tsx`. The sections to copy are:
> - "Work Context" SectionCard: lines 1817–1836
> - "Request Items" SectionCard: lines 1883–1952
> - "Disbursements" SectionCard: lines 1955–2084
> - Mobile "Request Items": lines 2443–2499
> - Mobile "Payment Vouchers": lines 2501–2549
> - Disburse dialog: lines 2744–2965
> - Voucher preview dialog: lines 2966–3322
> - Retire dialog: lines 3323–3567
> - Certificate of honor dialog: lines 3568–3750
>
> Replace all direct state references (`showDisburseDialog`, `disburseForm`, etc.) with `finance.showDisburseDialog`, `finance.disburseForm`, etc.
> Replace handler calls (`openVoucherEditor(v)`) with `finance.openVoucherEditor(v)`.
> Replace `handleDisburse()` call with `props.onHandleDisburse()`.
> Replace `handleRetire()` with `props.onHandleRetire()`.

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "FinanceRequestBody"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/requests/bodies/FinanceRequestBody.tsx
git commit -m "refactor(requests): create FinanceRequestBody component"
```

---

## Task 5: Wire up the wrapper — replace inline code with components

**Files:**
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`

This is the final wiring step. The wrapper keeps: AppShell, PageHeader, common queries, shared state (`actionComment`, `actionBusy`), right rail, loading/error states, common sections (Summary, Documents, Activity). It renders `<LeaveRequestBody />` or `<FinanceRequestBody />` based on `family`.

- [ ] **Step 1: Add imports to `RequestDetailsPage.tsx`**

```typescript
import { useFinanceRequest } from "./hooks/useFinanceRequest";
import { LeaveRequestBody } from "./bodies/LeaveRequestBody";
import { FinanceRequestBody } from "./bodies/FinanceRequestBody";
```

- [ ] **Step 2: Call `useFinanceRequest` in the component**

After the existing `const family = ...` line, add:

```typescript
const finance = useFinanceRequest(id, requestTotal, availableActions ?? []);
```

Then delete the finance-specific state declarations (lines 590–637) and the finance queries (lines 700–710) from the wrapper — they now live in the hook. Delete the finance dialog handler functions (lines 1073–1160) — they're in the hook.

Update `disbursedTotal`, `retiredTotal`, `remainingDisbursement`, `defaultFinanceAccountId` to use `finance.disbursedTotal` etc.

Update the `workflow` variable:
```typescript
const workflow =
  family === "leave"
    ? buildLeaveWorkflow(request, pendingApprovals, { showDraftStep: ... })
    : buildWorkflow(request, pendingApprovals, finance.paymentVouchers ?? [], { showDraftStep: ... });
```

- [ ] **Step 3: Replace the body sections in the desktop layout**

Find the desktop layout's `<div className="space-y-6 lg:col-span-8">` (around line 1778). After "Request Summary" SectionCard, replace the family-conditional body sections with:

```typescript
{family === "leave" ? (
  <LeaveRequestBody
    requestData={requestData}
    handoverColleagueName={handoverColleagueName}
  />
) : (
  <FinanceRequestBody
    request={request}
    requestData={requestData}
    categoryName={categoryName}
    projectName={projectName}
    teamName={teamName}
    organizationName={organizationName}
    requestTags={requestTags}
    lineItems={lineItems}
    currentUserId={currentUserId}
    detailView={detailView}
    ownerActionsVisible={ownerActionsVisible}
    availableActions={availableActions ?? []}
    actionBusy={actionBusy}
    finance={finance}
    onHandleDisburse={() => handleWorkflowAction("disburse")}
    onHandleRetire={() => handleWorkflowAction("retire")}
    onHandleVoucherSave={async () => { /* existing voucher save logic */ }}
  />
)}
```

- [ ] **Step 4: Update the right rail finance bits**

The "Disburse Request" button in the right rail currently calls `setShowDisburseDialog(true)`. Update it to:
```typescript
onClick={() => finance.openDisburseDialog()}
```

The "Current Total" card uses `disbursedTotal` — update to `finance.disbursedTotal`.

The finance progress `remainingDisbursement` — update to `finance.remainingDisbursement`.

- [ ] **Step 5: Remove the finance modals from the wrapper**

The disburse dialog (line ~2744), voucher preview (line ~2966), retire dialog (line ~3323), and certificate (line ~3568) are now rendered inside `FinanceRequestBody`. Delete them from `RequestDetailsPage.tsx`.

Also delete the now-unused top-level functions: `buildCertificateOfHonorPdf`, `formatCertificateCurrency` (moved to `FinanceRequestBody.tsx`).

- [ ] **Step 6: TypeScript check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 7: Manual smoke test**

Start the dev server:
```bash
cd apps/pwa && npm run dev
```

Check all four scenarios:
1. Open a **finance request** as the owner — Summary, Work Context, Request Items, Disbursements all visible. Disburse button in right rail opens dialog.
2. Open a **finance request** as finance approver — Disburse/Complete buttons visible.
3. Open a **leave request** as the owner — Leave Coverage section visible. No Work Context, no Request Items, no Disbursements.
4. Open a **leave request** as HR approver — Same as above, approve/reject actions work.

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "refactor(requests): wire LeaveRequestBody and FinanceRequestBody into wrapper"
```

---

## Self-Review

**Spec coverage:**
- ✅ New request family = new body file only — yes, wrapper dispatches on `family`
- ✅ Leave sections extracted — `LeaveRequestBody`
- ✅ Finance sections extracted — `FinanceRequestBody`
- ✅ Common sections stay in wrapper — Summary, Documents, Activity, right rail

**Placeholder scan:**
- Task 4 Step 1 contains implementation notes describing what to copy — this is intentional guidance, not a placeholder. The actual code to copy is identified by exact line numbers.

**Type consistency:**
- `UseFinanceRequestResult` defined in Task 2 and referenced as `Props.finance: UseFinanceRequestResult` in Task 4 — consistent.
- `onHandleDisburse: () => Promise<void>` passed from wrapper's `handleWorkflowAction("disburse")` — consistent.
