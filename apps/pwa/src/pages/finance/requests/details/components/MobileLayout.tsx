import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  MediaPickerModal,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextAreaField,
  WorkflowStepper,
  ActivityFeed,
} from "@/shared";
import { formatCurrency } from "@stanforte/shared";
import { formatDisplayDate } from "@stanforte/shared";
import { formatPersonName, formatRequestStatus, requestFamilyFromRecord } from "@/pages/requests/request-helpers";
import { listFileAssets, uploadFileAsset } from "@/pages/files/files-api";
import { DownloadDropdown } from "./DownloadDropdown";
import { useRequestDetails } from "../context";

export function MobileLayout() {
  const navigate = useNavigate();
  const {
    request,
    family,
    requestData,
    parentLabel,
    parentPath,
    viewerStatus,
    summaryCards,
    lineItems,
    paymentVouchers,
    workflow,
    financeActionsVisible,
    approvalActionsVisible,
    ownerActionsVisible,
    availableActions,
    actionBusy,
    actionComment,
    setActionComment,
    requestStatus,
    requestTotal,
    disbursedTotal,
    disbursementButtonLabel,
    canEditDraft,
    canShowNudge,
    nudgeHeadline,
    activityItems,
    canEditVoucher,
    openVoucherEditor,
    openVoucherPreview,
    setShowDisburseDialog,
    handleWorkflowAction,
    handleDeleteDraft,
    handleDownloadArtifact,
    openRetireDialog,
    copyNudge,
    retireForm,
    setRetireForm,
    showRetirementMediaPicker,
    setShowRetirementMediaPicker,
    currentUserId,
    id,
  } = useRequestDetails();

  return (
    <div className="space-y-4 lg:hidden">
      <div className="pt-1">
        <button
          type="button"
          onClick={() => navigate(parentPath)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Back to {parentLabel}
        </button>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
              {parentLabel}
            </p>
            <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">
              {request?.request_number || "Request details"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {request
                ? `${request.request_type?.name || requestFamilyFromRecord(request)} • ${formatPersonName(request.creator)} • ${formatDisplayDate(request.created_at)}`
                : "Loading..."}
            </p>
          </div>
          {request ? (
            <Chip variant={viewerStatus.tone}>{viewerStatus.label}</Chip>
          ) : null}
        </div>
      </div>

      {request ? (
        <>
          <section className="section-card bg-brand-900 p-5 text-white">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
              Status For You
            </p>
            <h2 className="mt-3 text-base font-semibold uppercase tracking-[0.08em] text-white/70">
              {viewerStatus.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/85">
              {viewerStatus.hint}
            </p>
          </section>

          <SectionCard title="Summary">
            <p className="text-sm leading-6 text-slate-600">
              {String(
                requestData.purpose ||
                  requestData.leave_reason ||
                  "No summary provided.",
              )}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  tone={card.tone}
                />
              ))}
            </div>
          </SectionCard>

          {family !== "leave" ? (
            <SectionCard title="Request Items">
              {lineItems.length ? (
                <div className="rounded-[22px] border border-slate-200 bg-white">
                  <Table caption="Request items">
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>Item</TableHeaderCell>
                        <TableHeaderCell>Qty</TableHeaderCell>
                        <TableHeaderCell>Total</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-950">
                                  {item.description || "Untitled item"}
                                </p>
                                {(item.files?.length ?? 0) > 0 ? (
                                  <Icon
                                    name="attach_file"
                                    className="text-[15px] text-brand-900"
                                  />
                                ) : null}
                              </div>
                              {item.notes ? (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-slate-700">
                            {item.quantity ?? 1}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-slate-700">
                            {formatCurrency(
                              (item.amount ?? 0) * (item.quantity ?? 1),
                              request.currency,
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  title="No line items"
                  description="This request does not include any itemized costs."
                />
              )}
            </SectionCard>
          ) : null}

          {(paymentVouchers ?? []).length ? (
            <SectionCard title="Payment Vouchers">
              <div className="rounded-[22px] border border-slate-200 bg-white">
                <Table caption="Payment vouchers">
                  <TableHead>
                    <TableHeaderRow>
                      <TableHeaderCell>PV</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Retirement</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Action
                      </TableHeaderCell>
                    </TableHeaderRow>
                  </TableHead>
                  <TableBody>
                    {(paymentVouchers ?? []).map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="text-left text-sm font-semibold text-brand-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                            onClick={() =>
                              canEditVoucher(voucher)
                                ? openVoucherEditor(voucher)
                                : openVoucherPreview(voucher)
                            }
                          >
                            {voucher.voucher_number}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {formatCurrency(voucher.amount, request.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {Number(voucher.retired_amount || 0) > 0 ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 text-left hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                              onClick={() => openVoucherPreview(voucher)}
                            >
                              {formatCurrency(
                                voucher.retired_amount,
                                request.currency,
                              )}
                            </button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              canEditVoucher(voucher)
                                ? openVoucherEditor(voucher)
                                : openVoucherPreview(voucher)
                            }
                          >
                            {canEditVoucher(voucher) ? "View / Edit" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Approval Workflow">
            <WorkflowStepper steps={workflow} />
          </SectionCard>

          <SectionCard title="Actions">
            <DownloadDropdown
              actionBusy={actionBusy}
              onDownloadRequestPdf={() =>
                void handleDownloadArtifact("request_pdf")
              }
              onDownloadFullDocument={() =>
                void handleDownloadArtifact("full_document")
              }
            />
            {canEditDraft ? (
              <Button
                variant="danger"
                className="mb-4 w-full justify-center"
                onClick={() => void handleDeleteDraft()}
                disabled={actionBusy !== ""}
              >
                {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
              </Button>
            ) : null}
            {approvalActionsVisible &&
            availableActions.some(
              (action) => action === "approve" || action === "reject",
            ) ? (
              <>
                <TextAreaField
                  label="Decision note"
                  helpText="Optional context for the requester and audit trail."
                  value={actionComment}
                  onChange={(event) => setActionComment(event.target.value)}
                  rows={3}
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => void handleWorkflowAction("approve")}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "approve"
                      ? financeActionsVisible
                        ? "Clearing..."
                        : "Approving..."
                      : financeActionsVisible
                        ? "Clear Request"
                        : "Approve Request"}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-center"
                    onClick={() => void handleWorkflowAction("reject")}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "reject"
                      ? "Rejecting..."
                      : "Reject Request"}
                  </Button>
                </div>
              </>
            ) : null}
            {ownerActionsVisible && availableActions.includes("submit") ? (
              <Button
                className="mt-4 w-full justify-center"
                onClick={() => void handleWorkflowAction("submit")}
                disabled={actionBusy !== ""}
              >
                {actionBusy === "submit" ? "Submitting..." : "Submit Request"}
              </Button>
            ) : null}
            {financeActionsVisible &&
            (requestStatus === "cleared" ||
              (requestStatus === "disbursed" &&
                requestTotal > disbursedTotal)) ? (
              <Button
                variant="secondary"
                className="mt-4 w-full justify-center"
                onClick={() => setShowDisburseDialog(true)}
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
                {actionBusy === "confirm"
                  ? "Confirming..."
                  : "Confirm Receipt"}
              </Button>
            ) : null}
            {ownerActionsVisible && availableActions.includes("retire") ? (
              <Button
                variant="secondary"
                className="mt-4 w-full justify-center"
                onClick={() => openRetireDialog()}
                disabled={actionBusy !== ""}
              >
                {actionBusy === "retire" ? "Preparing..." : "Retire PV"}
              </Button>
            ) : null}
            {financeActionsVisible &&
            availableActions.includes("complete") ? (
              <Button
                variant="secondary"
                className="mt-4 w-full justify-center"
                onClick={() => void handleWorkflowAction("complete")}
                disabled={actionBusy !== ""}
              >
                {actionBusy === "complete"
                  ? "Completing..."
                  : "Complete Request"}
              </Button>
            ) : null}
          </SectionCard>

          {canShowNudge ? (
            <SectionCard title="Need a nudge?">
              <p className="text-sm leading-6 text-slate-600">
                {nudgeHeadline}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                You do not have an action right now, but you can still remind
                the next reviewer to move this forward.
              </p>
              <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {viewerStatus.hint}
              </div>
              <Button
                className="mt-4 w-full justify-center"
                variant="secondary"
                onClick={() => void copyNudge()}
              >
                Copy reminder
              </Button>
            </SectionCard>
          ) : null}

          <SectionCard title="Activity">
            <ActivityFeed
              items={activityItems}
              emptyState="No activity recorded yet."
              limit={3}
            />
          </SectionCard>
        </>
      ) : null}

      <MediaPickerModal
        open={showRetirementMediaPicker}
        onClose={() => setShowRetirementMediaPicker(false)}
        title="Select Retirement Files"
        multiple
        selectedIds={retireForm.retirement_file_ids}
        loadFiles={async (search) =>
          listFileAssets({
            include_usage: true,
            per_page: 200,
            search,
            uploaded_by: currentUserId,
          })
        }
        uploadFiles={async (files, onProgress) => {
          const total = files.length;
          let uploadedCount = 0;
          for (const file of Array.from(files)) {
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            const uploaded = await uploadFileAsset(file, {
              organization_id:
                String(requestData.organization_id || "") || undefined,
              metadata: { source: "request_retirement", request_id: id },
            });
            uploadedCount += 1;
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            setRetireForm((current) => ({
              ...current,
              retirement_file_ids: Array.from(
                new Set([...current.retirement_file_ids, uploaded.id]),
              ),
            }));
          }
        }}
        onSelect={(files) => {
          setRetireForm((current) => ({
            ...current,
            retirement_file_ids: files.map((file) => file.id),
          }));
        }}
      />
    </div>
  );
}
