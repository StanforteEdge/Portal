import { Link } from "react-router-dom";
import { PaymentRequestBody } from "../bodies/PaymentRequestBody";
import { useRequestDetails, type DownloadArtifactAction } from "./context";
import { SummarySection, type SummaryCard } from "./shared/SummarySection";
import { formatViewerRequestStatus } from "@/pages/requests/request-helpers";
import { formatDisplayDate } from "@stanforte/shared";
import { SupportingDocsSection } from "./shared/SupportingDocsSection";
import { ActivitySection } from "./shared/ActivitySection";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { NudgeSection } from "./shared/NudgeSection";
import { DownloadsSection } from "./shared/DownloadsSection";
import { Button, RightRail, TextAreaField } from "@/shared";
import { formatCurrency } from "@stanforte/shared";

export function PaymentRequestDetail({ isMobile }: { isMobile: boolean }) {
  const {
    request,
    requestData,
    categoryName,
    projectName,
    teamName,
    organizationName,
    requestTags,
    lineItems,
    currentUserId,
    ownerActionsVisible,
    handlerActionsVisible,
    availableActions,
    actionBusy,
    finance,
    financeProgress,
    handleWorkflowAction,
    handleDownloadArtifact,
    viewerStatus,
    approvalActionsVisible,
    actionComment,
    setActionComment,
    isFinancePendingStep,
    canSubmit,
    workflowStatus,
    disbursementButtonLabel,
    requestTotal,
    pendingApprovals,
  } = useRequestDetails();

  if (!request) return null;

  const paymentCards: SummaryCard[] = [
    { label: "Total Amount", value: formatCurrency(request.total_amount, request.currency), tone: "neutral" },
    { label: "Due Date", value: formatDisplayDate(String(requestData.due_date || "")), tone: "neutral" },
    { label: "Current Step", value: pendingApprovals[0]?.step || formatViewerRequestStatus(request.status, availableActions), tone: "neutral" },
  ];

  const totalCard = (
    <section className="section-card bg-brand-900 p-5 text-white">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
        Current Total
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-[1.65rem] font-semibold tracking-tight">
          {formatCurrency(request.total_amount, request.currency)}
        </h3>
        {finance.disbursedTotal > 0 ? (
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
            / {formatCurrency(finance.disbursedTotal, request.currency)} disbursed
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/85">
        This total is calculated from the submitted request items and their supporting attachments.
      </p>
    </section>
  );

  const statusCard = (
    <section className="section-card bg-brand-900 p-5 text-white">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
        Status For You
      </p>
      <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
        {viewerStatus.label}
      </h3>
      <p className="mt-2 text-sm leading-6 text-white/85">
        {viewerStatus.hint}
      </p>

      {handlerActionsVisible && financeProgress?.label ? (
        <div className="mt-4 rounded-[18px] bg-white/10 px-4 py-3">
          <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/60">
            Finance Progress
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {financeProgress.label}
          </div>
          <div className="mt-1 text-sm leading-6 text-white/75">
            {financeProgress.hint}
          </div>
        </div>
      ) : null}

      {!isFinancePendingStep && approvalActionsVisible &&
      availableActions.some((action) =>
        ["approve", "reject", "return"].includes(action),
      ) ? (
        <div className="mt-4 space-y-3">
          <TextAreaField
            label="Decision note"
            helpText={
              availableActions.includes("return")
                ? "Required for Return. Optional for Approve/Reject."
                : "Optional context for the requester and audit trail."
            }
            value={actionComment}
            onChange={(event) => setActionComment(event.target.value)}
            rows={3}
            className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
          />
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => void handleWorkflowAction("approve")}
              disabled={actionBusy !== ""}
            >
              {actionBusy === "approve"
                ? handlerActionsVisible
                  ? "Clear Request"
                  : "Approve"
                : handlerActionsVisible
                  ? "Clear Request"
                  : "Approve"}
            </Button>
            <Button
              variant="danger"
              className="w-full justify-center"
              onClick={() => void handleWorkflowAction("reject")}
              disabled={actionBusy !== ""}
            >
              {actionBusy === "reject" ? "Rejecting..." : "Reject"}
            </Button>
            {availableActions.includes("return") ? (
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => void handleWorkflowAction("return")}
                disabled={actionBusy !== ""}
              >
                {actionBusy === "return" ? "Returning..." : "Return"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isFinancePendingStep && approvalActionsVisible ? (
        <p className="mt-4 text-sm text-white/75">
          This step requires Finance clearance.{" "}
          <Link
            to={`/finance/requests/${request.id}`}
            className="font-medium text-white underline"
          >
            Open in Finance
          </Link>
        </p>
      ) : null}

      {ownerActionsVisible && canSubmit ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => void handleWorkflowAction("submit")}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "submit"
            ? "Submitting..."
            : workflowStatus === "returned"
              ? "Resubmit Request"
              : "Submit Request"}
        </Button>
      ) : null}

      {handlerActionsVisible &&
      (request.status === "cleared" ||
        (request.status === "disbursed" &&
          requestTotal > finance.disbursedTotal)) ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => finance.openDisburseDialog()}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "disburse"
            ? "Disbursing..."
            : disbursementButtonLabel}
        </Button>
      ) : null}

      {ownerActionsVisible && availableActions.includes("confirm") ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => void handleWorkflowAction("confirm")}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "confirm" ? "Confirming..." : "Confirm Receipt"}
        </Button>
      ) : null}

      {ownerActionsVisible && availableActions.includes("retire") ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => finance.openRetireDialog()}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "retire" ? "Preparing..." : "Retire"}
        </Button>
      ) : null}

      {handlerActionsVisible && availableActions.includes("complete") ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => void handleWorkflowAction("complete")}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "complete" ? "Completing..." : "Complete Request"}
        </Button>
      ) : null}
    </section>
  );


  if (isMobile) {
    return (
      <div className="space-y-4">
        {statusCard}
        <SummarySection cards={paymentCards} />
        <PaymentRequestBody
          request={request}
          requestData={requestData}
          categoryName={categoryName}
          projectName={projectName}
          teamName={teamName}
          organizationName={organizationName}
          requestTags={requestTags}
          lineItems={lineItems}
          currentUserId={currentUserId}
          ownerActionsVisible={ownerActionsVisible}
          availableActions={availableActions}
          actionBusy={actionBusy}
          finance={finance}
          financeProgress={financeProgress}
          onHandleDisburse={() => handleWorkflowAction("disburse")}
          onHandleRetire={() => handleWorkflowAction("retire")}
          onHandleDownloadArtifact={async (action: DownloadArtifactAction, voucherId) => {
            await handleDownloadArtifact(action, voucherId);
          }}
        />
        <SupportingDocsSection />
        <WorkflowStepperCard />
        <DownloadsSection />
        <NudgeSection />
        <ActivitySection />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <SummarySection cards={paymentCards} />
        <PaymentRequestBody
          request={request}
          requestData={requestData}
          categoryName={categoryName}
          projectName={projectName}
          teamName={teamName}
          organizationName={organizationName}
          requestTags={requestTags}
          lineItems={lineItems}
          currentUserId={currentUserId}
          ownerActionsVisible={ownerActionsVisible}
          availableActions={availableActions}
          actionBusy={actionBusy}
          finance={finance}
          financeProgress={financeProgress}
          onHandleDisburse={() => handleWorkflowAction("disburse")}
          onHandleRetire={() => handleWorkflowAction("retire")}
          onHandleDownloadArtifact={async (action: DownloadArtifactAction, voucherId) => {
            await handleDownloadArtifact(action, voucherId);
          }}
        />
        <SupportingDocsSection />
        <ActivitySection />
      </div>

      <RightRail className="lg:col-span-4">
        {totalCard}
        {statusCard}
        <DownloadsSection />
        <NudgeSection />
        <WorkflowStepperCard />
      </RightRail>
    </div>
  );
}
