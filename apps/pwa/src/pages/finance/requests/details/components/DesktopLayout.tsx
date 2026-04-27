import { RightRail } from "@/shared";
import { useRequestDetails } from "../context";
import { RequestSummarySection } from "../components/sections/RequestSummarySection";
import { WorkContextSection } from "../components/sections/WorkContextSection";
import { LeaveCoverageSection } from "../components/sections/LeaveCoverageSection";
import { RequestItemsTable } from "../components/sections/RequestItemsTable";
import { PaymentVouchersTable } from "../components/sections/PaymentVouchersTable";
import { SupportingDocumentsSection } from "../components/sections/SupportingDocumentsSection";
import { RequestTotalCard } from "../components/right-rail/RequestTotalCard";
import { StatusForYouCard } from "../components/right-rail/StatusForYouCard";
import { DownloadsSection } from "../components/right-rail/DownloadsSection";
import { NudgeSection } from "../components/right-rail/NudgeSection";
import { ApprovalWorkflowSection } from "../components/right-rail/ApprovalWorkflowSection";
import { ActivitySectionCard } from "../components/right-rail/ActivitySectionCard";

export function DesktopLayout() {
  const { family, loading, error, request } = useRequestDetails();

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
        Loading request details...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
        {error}
      </div>
    );
  }
  if (!request) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <RequestSummarySection />
        {family !== "leave" ? <WorkContextSection /> : null}
        {family === "leave" ? (
          <LeaveCoverageSection />
        ) : (
          <RequestItemsTable />
        )}
        {family !== "leave" ? <PaymentVouchersTable /> : null}
        <SupportingDocumentsSection />
      </div>

      <RightRail className="lg:col-span-4">
        <RequestTotalCard />
        <StatusForYouCard />
        <DownloadsSection />
        <NudgeSection />
        <ApprovalWorkflowSection />
        <ActivitySectionCard />
      </RightRail>
    </div>
  );
}
