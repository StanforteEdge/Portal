import {
  ActivityFeed,
  Button,
  Chip,
  EmptyState,
  formatCurrency,
  Icon,
  PageHeader,
  RightRail,
  SectionCard,
  StatCard,
  WorkflowStepper,
  type WorkflowStep,
} from "@stanforte/shared";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCachedQuery } from "@/lib/core";
import { buildRequestsNavigation, requestsMobileNav } from "./requests-data";
import {
  getRequest,
  getRequestActions,
  listMyOrganizations,
  listProjects,
  listTeams,
  submitRequest,
} from "./requests-api";
import {
  formatDisplayDate,
  formatPersonName,
  formatRequestStatus,
  requestFamilyFromRecord,
  requestStatusTone,
} from "./request-helpers";

function buildWorkflow(requestStatus: string, pendingSteps: Array<{ step: string }>): WorkflowStep[] {
  const status = requestStatus.toLowerCase();
  const isDraft = status === "draft";
  const isSubmitted = ["sent", "approval", "submitted", "under_review", "review", "approved", "completed", "disbursed", "confirmed"].includes(status);
  const isComplete = ["approved", "completed", "disbursed", "confirmed"].includes(status);

  return [
    {
      label: "Drafted",
      detail: "Request initialized and saved.",
      status: "complete",
    },
    {
      label: "Submitted",
      detail: isDraft ? "Awaiting submission." : "Submitted into the review workflow.",
      status: isDraft ? "upcoming" : "complete",
    },
    {
      label: pendingSteps[0]?.step || "Review",
      detail: pendingSteps[0]?.step ? `Waiting on ${pendingSteps[0].step}.` : "Approval workflow in progress.",
      status: isDraft ? "upcoming" : isComplete ? "complete" : isSubmitted ? "current" : "upcoming",
    },
    {
      label: "Completed",
      detail: "Request closed and fully resolved.",
      status: isComplete ? "complete" : "upcoming",
    },
  ];
}

export function RequestDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const id = searchParams.get("id") || "";

  const {
    data: request,
    loading,
    error,
    refetch,
  } = useCachedQuery(
    `requests:detail:${id || "none"}`,
    () => {
      if (!id) return Promise.resolve(null);
      return getRequest(id);
    },
    { ttlMs: 1000 * 60, storage: "memory" }
  );

  const { data: requestActions } = useCachedQuery(
    `requests:actions:${id || "none"}`,
    () => {
      if (!id) return Promise.resolve([]);
      return getRequestActions(id);
    },
    { ttlMs: 1000 * 60, storage: "memory" }
  );
  const { data: projects } = useCachedQuery("requests:projects", () => listProjects(), {
    ttlMs: 1000 * 60 * 10,
    storage: "memory",
  });
  const { data: organizations } = useCachedQuery("requests:my-organizations", () => listMyOrganizations(), {
    ttlMs: 1000 * 60 * 10,
    storage: "memory",
  });
  const { data: teams } = useCachedQuery("requests:teams", () => listTeams(), {
    ttlMs: 1000 * 60 * 10,
    storage: "memory",
  });

  const family = requestFamilyFromRecord(request || undefined);
  const statusTone = requestStatusTone(request?.status);
  const requestData = request?.data && typeof request.data === "object" ? request.data : {};
  const projectName =
    projects?.find((entry) => entry.id === String(requestData.project_id || ""))?.name ||
    String(requestData.project_name || requestData.project_id || "-");
  const teamName =
    teams?.find((entry) => entry.id === String(requestData.team_id || ""))?.name ||
    String(requestData.team_name || requestData.team_id || "-");
  const organizationName =
    organizations?.find((entry) => entry.organization.id === String(requestData.organization_id || ""))?.organization.name ||
    String(requestData.organization_name || requestData.organization_id || "-");
  const lineItems = request?.items ?? [];
  const documents = lineItems.flatMap((item) => item.files ?? []);
  const pendingApprovals = request?.approvals?.pending ?? [];
  const completedApprovals = request?.approvals?.done ?? [];
  const workflow = buildWorkflow(String(request?.status || "draft"), pendingApprovals);
  const canSubmit = (requestActions ?? []).includes("submit") && String(request?.status || "").toLowerCase() === "draft";
  const canEditDraft = String(request?.status || "").toLowerCase() === "draft";

  const summaryCards = useMemo(() => {
    if (!request) return [];
    if (family === "leave") {
      return [
        {
          label: "Leave Dates",
          value: `${formatDisplayDate(String(requestData.start_date || ""))} - ${formatDisplayDate(String(requestData.end_date || ""))}`,
          tone: "neutral" as const,
        },
        {
          label: "Days Requested",
          value: String(requestData.days_requested || "-"),
          tone: "warning" as const,
        },
        {
          label: "Organization",
          value: String(requestData.organization_id || "-"),
          tone: "neutral" as const,
        },
      ];
    }

    return [
        {
          label: "Total Amount",
          value: formatCurrency(request.total_amount, request.currency),
          tone: "neutral" as const,
        },
        {
          label: "Project",
          value: projectName,
          tone: "warning" as const,
        },
        {
          label: "Organization",
          value: organizationName,
          tone: "neutral" as const,
        },
        {
          label: "Due Date",
          value: formatDisplayDate(String(requestData.due_date || "")),
          tone: "neutral" as const,
        },
      ];
    }, [family, organizationName, projectName, request, requestData]);

  const activityItems = useMemo(() => {
    const created = request?.created_at
      ? [
          {
            title: "Request created",
            description: "The request was saved into the workflow.",
            time: formatDisplayDate(request.created_at),
            tone: "neutral" as const,
            icon: "add_task",
          },
        ]
      : [];

    const done = completedApprovals.map((entry) => ({
      title: `${entry.step} ${entry.action}`,
      description: entry.comment || "Workflow action completed.",
      time: formatDisplayDate(entry.at),
      tone: entry.action === "reject" ? ("danger" as const) : ("success" as const),
      icon: entry.action === "reject" ? "cancel" : "task_alt",
    }));

    const pending = pendingApprovals.map((entry) => ({
      title: `${entry.step} pending`,
      description: `Waiting on ${entry.approver_type.replaceAll("_", " ")} action.`,
      time: "Pending",
      tone: "pending" as const,
      icon: "schedule",
    }));

    return [...created, ...done, ...pending];
  }, [completedApprovals, pendingApprovals, request?.created_at]);

  async function handleSubmit() {
    if (!id) return;
    try {
      setSubmitting(true);
      await submitRequest(id);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="My Requests"
        user={{ name: "Alex Sterling", role: "Fleet Operations" }}
        mobileNav={requestsMobileNav}
      >
        <div className="shell-panel flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <EmptyState
            title="No request selected"
            description="Open a request from the list so we can show its details."
          />
          <Link to="/requests" className="inline-flex">
            <Button>Back to Requests</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation({ includeDetails: true, detailsPath: `/requests/details?id=${id}` })}
      activeLabel="Request Details"
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={requestsMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[
            { label: "Requests", path: "/requests" },
            { label: request?.request_number || "Details" },
          ]}
          title={request?.request_number || (loading ? "Loading request..." : "Request details")}
          description={
            request
              ? `${request?.request_type?.name || requestFamilyFromRecord(request)} • ${formatPersonName(request.creator)} • ${formatDisplayDate(request.created_at)}`
              : "Review the request details, activity, and next step."
          }
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/requests" className="inline-flex">
                <Button variant="secondary" className="gap-2">
                  <Icon name="arrow_back" className="text-[18px]" />
                  Back to Requests
                </Button>
              </Link>
              {canEditDraft ? (
                <Link
                  to={`/requests/new/form?edit=${id}&typeId=${request?.request_type?.id || ""}`}
                  className="inline-flex"
                >
                  <Button className="gap-2">
                    <Icon name="edit" className="text-[18px]" />
                    Edit Draft
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        />

        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading request details...</div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">{error}</div>
        ) : request ? (
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <SectionCard title="Request Summary" action={<Chip variant={statusTone}>{formatRequestStatus(request.status)}</Chip>}>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {String(requestData.purpose || requestData.leave_reason || "No summary provided.")}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {summaryCards.map((card) => (
                    <StatCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
                  ))}
                </div>
              </SectionCard>

              {family !== "leave" ? (
                <SectionCard title="Work Context" description="The workstream and ownership context for this request.">
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Project" value={projectName} tone="neutral" />
                    <StatCard label="Team" value={teamName} tone="neutral" />
                    <StatCard label="Organization" value={organizationName} tone="neutral" />
                  </div>
                </SectionCard>
              ) : null}

              {family === "leave" ? (
                <SectionCard title="Leave Coverage" description="Leave-specific dates and handover details.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <StatCard label="Start Date" value={formatDisplayDate(String(requestData.start_date || ""))} tone="neutral" />
                    <StatCard label="End Date" value={formatDisplayDate(String(requestData.end_date || ""))} tone="neutral" />
                    <StatCard label="Days Requested" value={String(requestData.days_requested || "-")} tone="warning" />
                    <StatCard label="Handover Colleague" value={String(requestData.handover_user_id || "-")} tone="neutral" />
                  </div>
                  <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {String(requestData.handover_notes || "No handover notes captured.")}
                  </div>
                </SectionCard>
              ) : (
                <SectionCard
                  title="Request Items"
                  description="Itemized request costs and supporting notes."
                  action={<Chip variant="neutral">{lineItems.length} item{lineItems.length === 1 ? "" : "s"}</Chip>}
                >
                  {lineItems.length ? (
                    <div className="overflow-hidden rounded-[22px] border border-slate-200">
                      <table className="min-w-full text-left">
                        <thead className="bg-slate-50">
                          <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Unit Price</th>
                            <th className="px-4 py-3">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100 bg-white">
                              <td className="px-4 py-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-950">{item.description || "Untitled item"}</p>
                                    {(item.files?.length ?? 0) > 0 ? (
                                      <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-900/10 text-brand-900"
                                        title={`${item.files?.length} attachment${item.files?.length === 1 ? "" : "s"}`}
                                      >
                                        <Icon name="attach_file" className="text-[16px]" />
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.notes || "-"}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.quantity ?? 1}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                {formatCurrency(item.amount, request.currency)}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                {formatCurrency((item.amount ?? 0) * (item.quantity ?? 1), request.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState title="No line items" description="This request does not include any itemized costs." />
                  )}
                </SectionCard>
              )}

              <SectionCard title="Supporting Documents">
                {documents.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {documents.map((doc) => (
                      <article key={doc.id} className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-900/10 text-brand-900">
                          <Icon name="description" className="text-[20px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">{doc.file_name}</p>
                          <p className="mt-1 text-xs text-slate-500">{doc.mime_type || "Document"}</p>
                        </div>
                        {doc.public_url ? (
                          <a href={doc.public_url} target="_blank" rel="noreferrer" className="inline-flex">
                            <Button variant="secondary" size="sm">Open</Button>
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No supporting documents" description="No files are attached to this request yet." />
                )}
              </SectionCard>

              <SectionCard title="Activity">
                <ActivityFeed items={activityItems} emptyState="No activity recorded for this request yet." />
              </SectionCard>
            </div>

            <RightRail className="xl:col-span-4">
              <section className="section-card bg-brand-900 p-5 text-white">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                  {family === "leave" ? "Request Type" : "Current Total"}
                </p>
                <h3 className="mt-3 text-4xl font-semibold tracking-tight">
                  {family === "leave"
                    ? request.request_type?.name || requestFamilyFromRecord(request)
                    : formatCurrency(request.total_amount, request.currency)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  {family === "leave"
                    ? "This request follows the leave workflow and approval sequence."
                    : "This total is calculated from the submitted request items and their supporting attachments."}
                </p>
              </section>

              <section className="section-card bg-brand-900 p-5 text-white">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Next Step</p>
                <h3 className="mt-3 text-lg font-semibold">
                  {canSubmit
                    ? "This draft is ready to submit"
                    : pendingApprovals[0]?.step
                      ? `Awaiting ${pendingApprovals[0].step}`
                      : "Request is in progress"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  {canSubmit
                    ? "Submit the draft to move it into the workflow."
                    : pendingApprovals[0]?.step
                      ? `The request is waiting on ${pendingApprovals[0].step}.`
                      : "Review the activity and supporting documents for the latest state."}
                </p>
                {canSubmit ? (
                  <Button variant="secondary" className="mt-4 w-full justify-center" onClick={() => void handleSubmit()} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                ) : null}
              </section>

              <SectionCard title="Approval Workflow">
                <WorkflowStepper steps={workflow} />
              </SectionCard>
            </RightRail>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            Back
          </button>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">Request Details</p>
              <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">{request?.request_number || "Request details"}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {request ? `${request.request_type?.name || requestFamilyFromRecord(request)} • ${formatPersonName(request.creator)} • ${formatDisplayDate(request.created_at)}` : "Loading..."}
              </p>
            </div>
            {request ? <Chip variant={statusTone}>{formatRequestStatus(request.status)}</Chip> : null}
          </div>
        </div>

        {request ? (
          <>
            <section className="section-card bg-brand-900 p-5 text-white">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Next Step</p>
              <h2 className="mt-3 text-lg font-semibold">
                {pendingApprovals[0]?.step ? `Awaiting ${pendingApprovals[0].step}` : "Request in progress"}
              </h2>
            </section>

            <SectionCard title="Summary">
              <p className="text-sm leading-6 text-slate-600">
                {String(requestData.purpose || requestData.leave_reason || "No summary provided.")}
              </p>
            </SectionCard>

            <SectionCard title="Activity">
              <ActivityFeed items={activityItems} emptyState="No activity recorded yet." />
            </SectionCard>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export default RequestDetailsPage;
