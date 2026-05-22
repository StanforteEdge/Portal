import { Link } from "react-router-dom";
import { useRequestDetails } from "./context";
import { LoanRequestBody } from "../bodies/LoanRequestBody";
import { SummarySection, type SummaryCard } from "./shared/SummarySection";
import { SupportingDocsSection } from "./shared/SupportingDocsSection";
import { ActivitySection } from "./shared/ActivitySection";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { NudgeSection } from "./shared/NudgeSection";
import { DownloadsSection } from "./shared/DownloadsSection";
import { Button, RightRail, TextAreaField } from "@/shared";
import { formatCurrency, formatDisplayDate } from "@stanforte/shared";

export function LoanRequestDetail({ isMobile }: { isMobile: boolean }) {
  const {
    request,
    requestData,
    teamName,
    organizationName,
    viewerStatus,
    approvalActionsVisible,
    availableActions,
    actionBusy,
    actionComment,
    setActionComment,
    handleWorkflowAction,
    ownerActionsVisible,
    canSubmit,
    workflowStatus,
    handlerActionsVisible,
    isFinancePendingStep,
    loanProgress,
  } = useRequestDetails();

  if (!request) return null;

  const loanAmount = Number(request.total_amount || requestData?.loan_amount || 0);
  const repaymentPeriod = Number(requestData?.repayment_period_months || requestData?.repayment_months || 0);
  const monthlyInstallment = repaymentPeriod > 0 ? loanAmount / repaymentPeriod : 0;
  const disbursedAt = requestData?.disbursed_at as string | undefined;
  const summarycards: SummaryCard[] = [
    { label: "Loan Amount", value: formatCurrency(loanAmount, request.currency), tone: "neutral" },
    { label: "Repayment Period", value: repaymentPeriod > 0 ? `${repaymentPeriod} month${repaymentPeriod === 1 ? "" : "s"}` : "-", tone: "neutral" },
    { label: "Monthly Installment", value: monthlyInstallment > 0 ? formatCurrency(monthlyInstallment, request.currency) : "-", tone: "neutral" },
    { label: disbursedAt ? "Disbursed On" : "Disbursement", value: disbursedAt ? formatDisplayDate(disbursedAt) : "Pending", tone: disbursedAt ? "success" : "pending" },
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

      {handlerActionsVisible && loanProgress?.label ? (
        <div className="mt-4 rounded-[18px] bg-white/10 px-4 py-3">
          <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/60">
            Loan Progress
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {loanProgress.label}
          </div>
          <div className="mt-1 text-sm leading-6 text-white/75">
            {loanProgress.hint}
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
              {actionBusy === "approve" ? "Approving..." : "Approve"}
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

      {handlerActionsVisible && availableActions.includes("disburse") ? (
        <Button
          variant="secondary"
          className="mt-4 w-full justify-center"
          onClick={() => void handleWorkflowAction("disburse")}
          disabled={actionBusy !== ""}
        >
          {actionBusy === "disburse" ? "Disbursing..." : "Disburse Loan"}
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
        <SummarySection cards={summarycards} />
        <LoanRequestBody
          request={request}
          requestData={requestData}
          teamName={teamName}
          organizationName={organizationName}
          ownerActionsVisible={ownerActionsVisible}
          handlerActionsVisible={handlerActionsVisible}
          availableActions={availableActions}
          actionBusy={actionBusy}
          onHandleDisburse={() => handleWorkflowAction("disburse")}
          onHandleComplete={() => handleWorkflowAction("complete")}
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
        <SummarySection cards={summarycards} />
        <LoanRequestBody
          request={request}
          requestData={requestData}
          teamName={teamName}
          organizationName={organizationName}
          ownerActionsVisible={ownerActionsVisible}
          handlerActionsVisible={handlerActionsVisible}
          availableActions={availableActions}
          actionBusy={actionBusy}
          onHandleDisburse={() => handleWorkflowAction("disburse")}
          onHandleComplete={() => handleWorkflowAction("complete")}
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
