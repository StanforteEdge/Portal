import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { SectionCard, SelectField, TextAreaField, TextField } from "@/shared";
import { humanize } from "@stanforte/shared";
import type { RequestTypeOption, RequestCategoryOption, RequestRecord } from "@/pages/requests/requests-api";
import type { FamilyFormHandle } from "./family-form-types";
import { getMyLeaveBalance } from "@/pages/requests/requests-api";
import { useCachedQuery } from "@/shared/lib/core";
import { TagPicker } from "@/pages/requests/TagPicker";
import type { TagTerm } from "@/pages/requests/taxonomy-api";

type LeaveFormState = {
  organization_id: string;
  team_id: string;
  leave_start_date: string;
  leave_end_date: string;
  leave_days_requested: string;
  leave_handover_user_id: string;
  leave_handover_notes: string;
  purpose: string;
  is_special_request: boolean;
  special_request_justification: string;
};

type Props = {
  selectedType: RequestTypeOption;
  selectedCategory: RequestCategoryOption | null;
  organizationOptions: Array<{ id: string; name: string; code: string }>;
  groupOptions: Array<{ id: string; name: string; type: string; role: string }>;
  handoverOptions: Array<{ value: string; label: string }>;
  editRequest?: RequestRecord | null;
  loadingEdit: boolean;
  onSummary: (node: React.ReactNode) => void;
  tags?: TagTerm[];
  setTags?: (tags: TagTerm[]) => void;
  taxonomyKey?: string;
  isTagTaxonomy?: boolean;
};

function parseDateOnly(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export const LeaveRequestFormPage = forwardRef<FamilyFormHandle, Props>(({
  selectedType,
  selectedCategory,
  organizationOptions,
  groupOptions,
  handoverOptions,
  editRequest,
  loadingEdit,
  onSummary,
  tags = [],
  setTags,
  taxonomyKey = "",
  isTagTaxonomy = false,
}, ref) => {
  const [form, setForm] = useState<LeaveFormState>({
    organization_id: "",
    team_id: "",
    leave_start_date: "",
    leave_end_date: "",
    leave_days_requested: "",
    leave_handover_user_id: "",
    leave_handover_notes: "",
    purpose: "",
    is_special_request: false,
    special_request_justification: "",
  });

  useEffect(() => {
    if (!editRequest) return;
    const data = editRequest.data && typeof editRequest.data === "object" ? editRequest.data : {};
    setForm({
      organization_id: String(data.organization_id || editRequest.organization_id || ""),
      team_id: String(data.team_id || editRequest.team_id || ""),
      leave_start_date: String(data.start_date || ""),
      leave_end_date: String(data.end_date || ""),
      leave_days_requested: data.days_requested !== undefined && data.days_requested !== null ? String(data.days_requested) : "",
      leave_handover_user_id: String(data.handover_user_id || ""),
      leave_handover_notes: String(data.handover_notes || ""),
      purpose: String(data.purpose || ""),
      is_special_request: Boolean(data.is_special_request),
      special_request_justification: String(data.special_request_justification || ""),
    });
  }, [editRequest]);

  useEffect(() => {
    if (!organizationOptions?.length) return;
    if (organizationOptions.length === 1) {
      setForm((prev) => ({ ...prev, organization_id: prev.organization_id || organizationOptions[0].id }));
    }
  }, [organizationOptions]);

  useEffect(() => {
    if (!groupOptions?.length) return;
    if (groupOptions.length === 1) {
      setForm((prev) => ({ ...prev, team_id: prev.team_id || groupOptions[0].id }));
    }
  }, [groupOptions]);

  const minNoticeDays = Number(
    (selectedType?.form_schema as Record<string, unknown> | null)?.min_notice_days ?? 0,
  );
  const maxDaysPerRequest = Number(
    (selectedType?.form_schema as Record<string, unknown> | null)?.max_days_per_request ??
      (selectedType?.form_schema as Record<string, unknown> | null)?.max_days ??
      0,
  );
  const isSingleDay = maxDaysPerRequest === 1;

  useEffect(() => {
    if (isSingleDay) {
      if (form.leave_start_date) {
        setForm((prev) => ({
          ...prev,
          leave_end_date: form.leave_start_date,
          leave_days_requested: "1",
        }));
      } else {
        setForm((prev) => ({ ...prev, leave_end_date: "", leave_days_requested: "" }));
      }
    } else if (form.leave_start_date && form.leave_end_date) {
      const start = new Date(form.leave_start_date);
      const end = new Date(form.leave_end_date);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
        const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        setForm((prev) => ({ ...prev, leave_days_requested: String(days) }));
      }
    }
  }, [form.leave_end_date, form.leave_start_date, isSingleDay]);

  const minStartDate = useMemo(() => {
    if (minNoticeDays <= 0) return "";
    const date = new Date();
    date.setDate(date.getDate() + minNoticeDays);
    return date.toISOString().slice(0, 10);
  }, [minNoticeDays]);

  const { data: leaveBalanceData } = useCachedQuery(
    ["requests:leave-balance", selectedType?.id ?? "none", form.leave_start_date || "current"].join(":"),
    () =>
      getMyLeaveBalance({
        year: form.leave_start_date ? new Date(form.leave_start_date).getFullYear() : new Date().getFullYear(),
        leave_type_key: String(selectedType?.form_schema?.leave_type_key || selectedType?.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
      }),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );
  const leaveBalance = leaveBalanceData?.summary?.[0]?.available_days ?? null;
  const requestedDays = Number(form.leave_days_requested || 0);
  const leaveBalanceHit = leaveBalance !== null && requestedDays > leaveBalance;

  useEffect(() => {
    onSummary(
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
          {selectedCategory?.name || "Leave Request"}
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">
          {form.leave_days_requested
            ? `${form.leave_days_requested} day${Number(form.leave_days_requested) === 1 ? "" : "s"}`
            : "— days"}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {selectedCategory?.description || selectedType?.name || "Leave request"}
        </p>
        <div className="mt-4 space-y-2">
          {leaveBalance !== null ? (
            <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">Available Balance</p>
              <p className="mt-2 text-2xl font-semibold">{leaveBalance} days</p>
            </div>
          ) : null}
          {minNoticeDays > 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">Notice Required</p>
              <p className="mt-2 text-lg font-semibold">{minNoticeDays} day{minNoticeDays === 1 ? "" : "s"} in advance</p>
            </div>
          ) : null}
          {maxDaysPerRequest > 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">Max Per Request</p>
              <p className="mt-2 text-lg font-semibold">{maxDaysPerRequest} day{maxDaysPerRequest === 1 ? "" : "s"}</p>
            </div>
          ) : null}
          <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">Handover & Approval</p>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Handover colleague is notified to acknowledge coverage.
              Team lead/workflow approvers still approve or reject leave.
            </p>
          </div>
        </div>
      </section>,
    );
  }, [form.leave_days_requested, selectedCategory, selectedType, leaveBalance, minNoticeDays, maxDaysPerRequest, onSummary]);

  useImperativeHandle(ref, () => ({
    validateAndBuild: () => {
      if (!form.purpose.trim()) {
        return { error: "Reason is required." };
      }
      if (!form.leave_start_date || !form.leave_end_date) {
        return { error: "Leave start and end dates are required." };
      }
      if (new Date(form.leave_end_date) < new Date(form.leave_start_date)) {
        return { error: "Leave end date cannot be before start date." };
      }
      if (!form.leave_days_requested || Number(form.leave_days_requested) <= 0) {
        return { error: "Leave days requested must be greater than zero." };
      }
      if (leaveBalanceHit && !form.is_special_request) {
        return { error: `Insufficient leave balance (${leaveBalance} days available). Check "Special Request" to bypass with justification.` };
      }
      if (form.is_special_request && !form.special_request_justification.trim()) {
        return { error: "Justification is required for special requests." };
      }
      const leaveDaysRequested = Number(form.leave_days_requested);
      if (maxDaysPerRequest > 0 && leaveDaysRequested > maxDaysPerRequest) {
        return { error: `Leave days requested cannot exceed ${maxDaysPerRequest} day${maxDaysPerRequest === 1 ? "" : "s"} for this leave type.` };
      }
      if (minNoticeDays > 0) {
        const start = parseDateOnly(form.leave_start_date);
        const minStart = new Date();
        minStart.setHours(0, 0, 0, 0);
        minStart.setDate(minStart.getDate() + minNoticeDays);
        if (start && start < minStart) {
          return { error: `Leave start date must be at least ${minNoticeDays} day${minNoticeDays === 1 ? "" : "s"} from today.` };
        }
      }
      if (!form.leave_handover_user_id) {
        return { error: "Handover colleague is required." };
      }
      if (!form.leave_handover_notes.trim()) {
        return { error: "Handover notes are required." };
      }

      return {
        payload: {
          team_id: form.team_id || undefined,
          data: {
            purpose: form.purpose.trim(),
            organization_id: form.organization_id || undefined,
            start_date: form.leave_start_date || undefined,
            end_date: form.leave_end_date || undefined,
            days_requested: Number(form.leave_days_requested),
            leave_type_key: String(selectedType?.form_schema?.leave_type_key || selectedType?.name || "")
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, ""),
            handover_user_id: form.leave_handover_user_id || undefined,
            handover_notes: form.leave_handover_notes.trim() || undefined,
            is_special_request: form.is_special_request,
            special_request_justification: form.is_special_request ? form.special_request_justification.trim() : undefined,
          },
        },
      };
    },
  }));

  return (
    <>
      {isTagTaxonomy && setTags ? (
        <SectionCard title="Tags" description="Classify this request with relevant tags.">
          <TagPicker
            taxonomyKey={taxonomyKey}
            value={tags}
            onChange={setTags}
            placeholder="Add tags"
            label="Tags"
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Leave Schedule"
        description={isSingleDay ? "Select the date for this one-day leave." : "Capture the date range for this leave request."}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <TextField
              label={isSingleDay ? "Leave Date" : "Start Date"}
              type="date"
              value={form.leave_start_date}
              min={minStartDate || undefined}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, leave_start_date: event.target.value }))
              }
            />
            {minNoticeDays > 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                This leave type requires at least {minNoticeDays} day{minNoticeDays === 1 ? "" : "s"} notice — earliest date is {minStartDate}.
              </p>
            ) : null}
          </div>
          {!isSingleDay ? (
            <TextField
              label="End Date"
              type="date"
              value={form.leave_end_date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, leave_end_date: event.target.value }))
              }
            />
          ) : null}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <TextAreaField
            label="Reason for Request"
            value={form.purpose}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, purpose: event.target.value }))
            }
            placeholder="Explain the leave reason and any planning context."
          />
        </div>

        {leaveBalanceHit && (
          <div className="mt-5 rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-amber-700">
              Warning: You are requesting more days ({requestedDays}) than your available balance ({leaveBalance}).
            </p>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_special_request}
                onChange={(e) => setForm(prev => ({ ...prev, is_special_request: e.target.checked }))}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              Submit as a Special Request
            </label>
            {form.is_special_request && (
              <div className="mt-4">
                <TextAreaField
                  label="Special Request Justification"
                  value={form.special_request_justification}
                  onChange={(e) => setForm(prev => ({ ...prev, special_request_justification: e.target.value }))}
                  placeholder="Provide justification for why this leave should be granted despite insufficient balance."
                />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Work Context"
        description="Tie the request to the right organization and group."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectField
            label="Organization"
            value={form.organization_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, organization_id: event.target.value }))
            }
            disabled={organizationOptions.length <= 1}
          >
            <option value="">Select organization</option>
            {organizationOptions.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </SelectField>
          <SelectField
            label="Group"
            value={form.team_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, team_id: event.target.value }))
            }
            disabled={groupOptions.length <= 1}
          >
            <option value="">Select group</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({humanize(group.type)})
              </option>
            ))}
          </SelectField>
        </div>
      </SectionCard>

      <SectionCard
        title="Handover Plan"
        description="Identify who will cover and how work will be handed over."
      >
        <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
          Handover colleague receives an acknowledgement notice.
          Leave approval decisions are still made by team lead/workflow approvers.
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectField
            label="Handover Colleague"
            value={form.leave_handover_user_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, leave_handover_user_id: event.target.value }))
            }
          >
            <option value="">Select colleague</option>
            {handoverOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Handover Notes"
            value={form.leave_handover_notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, leave_handover_notes: event.target.value }))
            }
            placeholder="Summarize work coverage, dependencies, and any notes for the covering colleague."
          />
        </div>
      </SectionCard>
    </>
  );
});

LeaveRequestFormPage.displayName = "LeaveRequestFormPage";
