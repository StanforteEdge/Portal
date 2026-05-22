import { useRequestDetails } from "./context";
import { LeaveRequestBody } from "../bodies/LeaveRequestBody";
import { SummarySection, type SummaryCard } from "./shared/SummarySection";
import { formatDisplayDate } from "@stanforte/shared";
import { SupportingDocsSection } from "./shared/SupportingDocsSection";
import { ActivitySection } from "./shared/ActivitySection";
import { WorkflowStepperCard } from "./shared/WorkflowStepperCard";
import { NudgeSection } from "./shared/NudgeSection";
import { DownloadsSection } from "./shared/DownloadsSection";
import { Button, RightRail, TextAreaField } from "@/shared";

export function LeaveRequestDetail({ isMobile }: { isMobile: boolean }) {
  const {
    request,
    requestData,
    handoverColleagueName,
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
    organizationName,
  } = useRequestDetails();

  if (!request) return null;

  const leaveCards: SummaryCard[] = [
    { label: "Leave Dates", value: `${formatDisplayDate(String(requestData.start_date || ""))} – ${formatDisplayDate(String(requestData.end_date || ""))}`, tone: "neutral" },
    { label: "Days Requested", value: String(requestData.days_requested || "-"), tone: "warning" },
    { label: "Organization", value: organizationName, tone: "neutral" },
  ];

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

      {approvalActionsVisible &&
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
    </section>
  );

  const typeHeaderCard = (
    <section className="section-card bg-brand-900 p-5 text-white">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
        Request Type
      </p>
      <h3 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
        {request.request_type?.name || "Leave"}
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/85">
        This request follows the leave workflow and approval sequence.
      </p>
    </section>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {statusCard}
        <SummarySection cards={leaveCards} />
        <LeaveRequestBody
          requestData={requestData}
          handoverColleagueName={handoverColleagueName}
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
        <SummarySection cards={leaveCards} />
        <LeaveRequestBody
          requestData={requestData}
          handoverColleagueName={handoverColleagueName}
        />
        <SupportingDocsSection />
        <ActivitySection />
      </div>

      <RightRail className="lg:col-span-4">
        {typeHeaderCard}
        {statusCard}
        <DownloadsSection />
        <NudgeSection />
        <WorkflowStepperCard />
      </RightRail>
    </div>
  );
}
