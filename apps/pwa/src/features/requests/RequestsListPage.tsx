import {
  ActivityFeed,
  Button,
  Chip,
  formatCurrency,
  Icon,
  PageHeader,
  RightRail,
  SectionCard,
  StatCard,
} from "@stanforte/shared";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useCachedQuery } from "@/lib/core";
import { useAuth } from "@/features/auth/AuthProvider";
import { listApprovals, listRequests, listRequestTypes, type RequestRecord } from "./requests-api";
import {
  buildRequestsNavigation,
  requestsMobileNav,
} from "./requests-data";

type RequestScope = "mine" | "approvals";
type RequestFamily = "all" | "financial" | "leave";

type UiRequestRow = {
  id: string;
  requestId: string;
  family: RequestFamily;
  familyLabel: string;
  type: string;
  requestTypeId: string;
  categoryKey: string;
  totalAmount: number;
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
  organizationId: string;
  organizationName: string;
  purpose: string;
  submitted: string;
  status: string;
  statusKey: string;
  tone: "success" | "warning" | "pending" | "danger" | "neutral";
  icon: string;
  summary: string;
  detail: string;
  createdAtIso?: string;
  startDateIso?: string;
  endDateIso?: string;
  daysRequested?: number;
};

type RequestOption = {
  value: string;
  label: string;
};

type SortBy = "created_at" | "request_number" | "total_amount" | "status" | "request_type";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toTone(status: string): "success" | "warning" | "pending" | "danger" | "neutral" {
  const key = status.toLowerCase();
  if (["approved", "completed", "paid", "disbursed", "confirmed"].includes(key)) return "success";
  if (["rejected", "cancelled", "voided"].includes(key)) return "danger";
  if (["under_review", "review", "draft", "prepared"].includes(key)) return "warning";
  if (["pending", "sent", "approval", "submitted"].includes(key)) return "pending";
  return "neutral";
}

function classifyFamily(categoryKey: string, requestType: string): RequestFamily {
  const category = categoryKey.toLowerCase();
  const type = requestType.toLowerCase();
  if (category.includes("leave") || type.includes("leave")) return "leave";
  if (category.includes("finance") || category.includes("payment") || type.includes("cash") || type.includes("reimbursement") || type.includes("expense") || type.includes("financial")) {
    return "financial";
  }
  return "financial";
}

function familyLabel(family: RequestFamily) {
  if (family === "leave") return "Leave";
  if (family === "financial") return "Financial";
  return "All";
}

function toRow(request: RequestRecord) {
  const rawStatus = String(request.status || "Pending");
  const requestType = request.request_type?.name || "General Request";
  const itemCount = Array.isArray(request.items) ? request.items.length : 0;
  const amountLabel = formatCurrency(request.total_amount, request.currency);
  const data = request.data && typeof request.data === "object" ? request.data : {};
  const projectId = String(data.project_id ?? "").trim();
  const projectName = String(data.project_name ?? "").trim();
  const teamId = String(data.team_id ?? "").trim();
  const teamName = String(data.team_name ?? data.team ?? "").trim();
  const organizationId = String(data.organization_id ?? "").trim();
  const organizationName = String(data.organization_name ?? data.organization ?? "").trim();
  const purpose = String(data.purpose ?? "").trim();
  const startDateIso = typeof data.start_date === "string" ? data.start_date : undefined;
  const endDateIso = typeof data.end_date === "string" ? data.end_date : undefined;
  const parsedDays = Number(data.days_requested ?? 0);
  const daysRequested = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : undefined;

  const category = String(request.request_type?.category_key || "").toLowerCase();
  const family = classifyFamily(category, requestType);
  const icon =
    category.includes("leave")
      ? "event_note"
      : category.includes("finance")
        ? "payments"
        : category.includes("asset")
          ? "inventory_2"
          : "description";

  return {
    id: request.request_number || `REQ-${request.id}`,
    requestId: String(request.id),
    family,
    familyLabel: familyLabel(family),
    type: requestType,
    requestTypeId: String(request.request_type?.id ?? ""),
    categoryKey: category,
    totalAmount: Number(request.total_amount ?? 0),
    projectId,
    projectName,
    teamId,
    teamName,
    organizationId,
    organizationName,
    purpose,
    submitted: formatDate(request.created_at),
    status: rawStatus.replaceAll("_", " "),
    statusKey: rawStatus.toLowerCase(),
    tone: toTone(rawStatus),
    icon,
    summary: itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "No line items",
    detail: amountLabel,
    createdAtIso: request.created_at,
    startDateIso,
    endDateIso,
    daysRequested,
  };
}

function isPendingLike(row: UiRequestRow) {
  return (
    row.tone === "pending" ||
    row.tone === "warning" ||
    ["pending", "submitted", "approval", "under_review", "review", "draft", "prepared"].some((key) =>
      row.statusKey.includes(key)
    )
  );
}

function isCompletedLike(row: UiRequestRow) {
  return (
    row.tone === "success" ||
    ["approved", "completed", "paid", "disbursed", "confirmed"].some((key) =>
      row.statusKey.includes(key)
    )
  );
}

function dateOnlyKey(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTitleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLeaveDateRange(row: UiRequestRow) {
  const start = row.startDateIso ? formatDate(row.startDateIso) : "-";
  const end = row.endDateIso ? formatDate(row.endDateIso) : "-";
  if (start === "-" && end === "-") return "-";
  return `${start} - ${end}`;
}

function formatLeaveDuration(row: UiRequestRow) {
  if (row.daysRequested && row.daysRequested > 0) {
    return `${row.daysRequested} day${row.daysRequested === 1 ? "" : "s"}`;
  }
  if (row.startDateIso && row.endDateIso) {
    const start = new Date(row.startDateIso);
    const end = new Date(row.endDateIso);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
      const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
      return `${days} day${days === 1 ? "" : "s"}`;
    }
  }
  return "-";
}

function ListFilters({
  activeFamily,
  status,
  statusOptions,
  onStatusChange,
  requestTypes,
  selectedRequestTypeId,
  onRequestTypeChange,
  dateLabel,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  moreFiltersOpen,
  onToggleMoreFilters,
  dateRangeOpen,
  onToggleDateRange,
  search,
  onSearchChange,
  projectOptions,
  selectedProject,
  onProjectChange,
  teamOptions,
  selectedTeam,
  onTeamChange,
  organizationOptions,
  selectedOrganization,
  onOrganizationChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: {
  activeFamily: RequestFamily;
  status: string;
  statusOptions: RequestOption[];
  onStatusChange: (status: string) => void;
  requestTypes: RequestOption[];
  selectedRequestTypeId: string;
  onRequestTypeChange: (value: string) => void;
  dateLabel: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  moreFiltersOpen: boolean;
  onToggleMoreFilters: () => void;
  dateRangeOpen: boolean;
  onToggleDateRange: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  projectOptions: RequestOption[];
  selectedProject: string;
  onProjectChange: (value: string) => void;
  teamOptions: RequestOption[];
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  organizationOptions: RequestOption[];
  selectedOrganization: string;
  onOrganizationChange: (value: string) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
}) {
  const requestTypeLabel =
    activeFamily === "financial"
      ? "Financial Type"
      : activeFamily === "leave"
        ? "Leave Type"
        : "Request Subtype";
  const searchPlaceholder =
    activeFamily === "leave"
      ? "Request no, leave type, reason"
      : activeFamily === "financial"
        ? "Request no, financial type, purpose"
        : "Request no, subtype, purpose";

  return (
    <section className="section-card p-4 sm:p-5" aria-label="Request filters">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[180px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 focus-within:ring-4 focus-within:ring-brand-900/10">
          <span className="inline-flex items-center gap-2">
            <Icon name="flag" className="text-[18px] text-slate-400" />
            Status
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="border-0 bg-transparent py-0 pl-2 pr-6 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-0"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[210px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 focus-within:ring-4 focus-within:ring-brand-900/10">
          <span className="inline-flex items-center gap-2">
            <Icon name="filter_alt" className="text-[18px] text-slate-400" />
            {requestTypeLabel}
          </span>
          <select
            value={selectedRequestTypeId}
            onChange={(event) => onRequestTypeChange(event.target.value)}
            className="border-0 bg-transparent py-0 pl-2 pr-6 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-0"
          >
            {requestTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleDateRange}
            className="inline-flex min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="date_range" className="text-[18px] text-slate-400" />
              Date Range
            </span>
            <span className="truncate text-sm font-semibold text-slate-700">{dateLabel}</span>
          </button>

          {dateRangeOpen ? (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-[320px] rounded-[22px] border border-slate-200 bg-white p-4 shadow-card">
              <div className="grid gap-3">
                <label className="grid gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => onDateFromChange(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => onDateToChange(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onToggleMoreFilters}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
        >
          <Icon name="tune" className="text-[18px] text-slate-400" />
          More Filters
        </button>
      </div>

      {moreFiltersOpen ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            />
          </label>

          {activeFamily !== "leave" ? (
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Project</span>
              <select
                value={selectedProject}
                onChange={(event) => onProjectChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              >
                {projectOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {activeFamily === "financial" ? (
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Team</span>
              <select
                value={selectedTeam}
                onChange={(event) => onTeamChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              >
                {teamOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Organization</span>
            <select
              value={selectedOrganization}
              onChange={(event) => onOrganizationChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            >
              {organizationOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value as SortBy)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            >
              <option value="created_at">Created date</option>
              <option value="request_number">Request number</option>
              <option value="total_amount">Total amount</option>
              <option value="status">Status</option>
              <option value="request_type">Request type</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Order</span>
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value as "asc" | "desc")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      ) : null}
    </section>
  );
}

function RequestsListTable({
  activeFamily,
  rows,
  loading,
  error,
  onRetry,
  currentPage,
  totalPages,
  totalCount,
  perPage,
  onPerPageChange,
  onPageChange,
}: {
  activeFamily: RequestFamily;
  rows: UiRequestRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}) {
  const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 7);
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(totalCount, currentPage * perPage);
  return (
    <SectionCard
      title={
        activeFamily === "leave"
          ? "Leave Requests"
          : activeFamily === "financial"
            ? "Financial Requests"
            : "All Requests"
      }
      description="Track and manage your operational submissions."
      action={
        <Chip variant="neutral">
          Showing {pageStart}-{pageEnd} of {totalCount} request{totalCount === 1 ? "" : "s"}
        </Chip>
      }
    >
      {loading ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading requests...</div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
          {error}
          <button type="button" onClick={onRetry} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
              <th className="px-3 py-2">Request ID</th>
              {activeFamily === "all" ? <th className="px-3 py-2">Family</th> : null}
              {activeFamily === "financial" ? <th className="px-3 py-2">Amount</th> : null}
              {activeFamily === "financial" ? <th className="px-3 py-2">Project</th> : null}
              {activeFamily === "leave" ? <th className="px-3 py-2">Leave Dates</th> : null}
              {activeFamily === "leave" ? <th className="px-3 py-2">Duration</th> : null}
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="rounded-2xl bg-slate-50">
                <td className="rounded-l-2xl px-3 py-4">
                  <p className="text-sm font-semibold text-brand-900">{row.id}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Icon name={row.icon} className="text-[16px]" />
                    <span>{row.type}</span>
                  </div>
                </td>
                {activeFamily === "all" ? (
                  <td className="px-3 py-4 text-sm text-slate-600">{row.familyLabel}</td>
                ) : null}
                {activeFamily === "financial" ? (
                  <td className="px-3 py-4 text-sm text-slate-600">{row.detail}</td>
                ) : null}
                {activeFamily === "financial" ? (
                  <td className="px-3 py-4 text-sm text-slate-600">{row.projectName || "-"}</td>
                ) : null}
                {activeFamily === "leave" ? (
                  <td className="px-3 py-4 text-sm text-slate-600">{formatLeaveDateRange(row)}</td>
                ) : null}
                {activeFamily === "leave" ? (
                  <td className="px-3 py-4 text-sm text-slate-600">{formatLeaveDuration(row)}</td>
                ) : null}
                <td className="px-3 py-4 text-sm text-slate-600">{row.submitted}</td>
                <td className="px-3 py-4">
                  <Chip variant={row.tone}>{row.status.toUpperCase()}</Chip>
                </td>
                <td className="rounded-r-2xl px-3 py-4 text-right">
                  <Link
                    to={`/requests/details?id=${row.requestId}`}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                  >
                    View Details
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <span>Per page</span>
            <select
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
          {pageButtons.map((pageNumber) => (
            <button
              key={pageNumber}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold",
                currentPage === pageNumber ? "bg-brand-900 text-white" : "bg-white text-slate-500",
              ].join(" ")}
              type="button"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function RequestsMobileList({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: UiRequestRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return <div className="rounded-[22px] bg-slate-50 px-4 py-5 text-sm text-slate-500">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-5 text-sm text-danger">
        {error}
        <button className="ml-2 font-semibold underline" type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link
          key={row.id}
          to={`/requests/details?id=${row.requestId}`}
          className="flex w-full items-start justify-between gap-3 rounded-[22px] border border-slate-100 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
        >
          <div className="flex min-w-0 gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-brand-900">
              <Icon name={row.icon} className="text-[20px]" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{row.type}</p>
                <Chip variant={row.tone}>{row.status.toUpperCase()}</Chip>
              </div>
              <p className="mt-1 text-sm text-slate-500">{row.summary}</p>
              <p className="mt-3 text-sm font-semibold text-slate-700">{row.detail}</p>
              <p className="mt-1 text-xs text-slate-500">{row.submitted}</p>
            </div>
          </div>
          <Icon name="chevron_right" className="mt-1 text-[18px] text-slate-400" />
        </Link>
      ))}
    </div>
  );
}

function EfficientApprovalsCard() {
  return (
    <SectionCard title="Efficient Approvals">
      <div className="rounded-[22px] bg-slate-50 p-5">
        <p className="text-sm leading-6 text-slate-500">
          Complete your profile to speed reimbursement requests by 30% faster with automated
          payroll matching.
        </p>
        <Button variant="secondary" size="sm" className="mt-4">
          Update Profile
        </Button>
      </div>
    </SectionCard>
  );
}

function HelpPanel() {
  return (
    <section className="section-card bg-brand-900 p-5 text-white">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="support_agent" className="text-[20px]" />
        </span>
        <div>
          <h3 className="text-base font-semibold">Need help with a request?</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Our support team is available 24/7 for operational queries.
          </p>
        </div>
      </div>
      <Button variant="secondary" className="mt-4 w-full justify-center">
        Visit Support Center
      </Button>
    </section>
  );
}

export function RequestsListPage({ scope = "mine" }: { scope?: RequestScope }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const [selectedRequestTypeId, setSelectedRequestTypeId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const familyParam = searchParams.get("family");
  const activeScope: RequestScope = scope;
  const activeFamily: RequestFamily =
    familyParam === "financial" || familyParam === "leave" || familyParam === "all" ? familyParam : "all";

  const organizations = useMemo(
    () => (Array.isArray(user?.organizations) ? user.organizations.filter((entry) => entry.id) : []),
    [user?.organizations]
  );

  const permissions = (user?.permissions ?? []).map((entry) => entry.toLowerCase());
  const roles = (user?.roles ?? []).map((entry) => entry.toLowerCase());
  const canSeeApprovals =
    permissions.some((entry) => entry.includes("approve") || entry.includes("requests.manage")) ||
    roles.some((entry) => ["team_lead", "manager", "admin", "finance", "finance_lead"].includes(entry));

  const {
    data: requestsData,
    loading: loadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = useCachedQuery(
    [
      "requests:list",
      activeScope,
    ].join(":"),
    () => {
      if (activeScope === "approvals") {
        return listApprovals();
      }

      return listRequests({ only_mine: "true" });
    },
    { ttlMs: 1000 * 60 * 2, storage: "memory" }
  );

  const { data: requestTypes } = useCachedQuery(
    "requests:types",
    () => listRequestTypes(),
    { ttlMs: 1000 * 60 * 10, storage: "local" }
  );

  const apiRows = useMemo(() => {
    const source = Array.isArray(requestsData) ? requestsData : [];
    const mapped = source.map(toRow);
    return mapped;
  }, [requestsData]);

  const allRows: UiRequestRow[] = requestsError ? [] : apiRows;

  const requestTypeOptions = useMemo(() => {
    const apiTypeOptions = Array.isArray(requestTypes)
      ? requestTypes
          .filter((item) => item?.id && item?.name)
          .map((item) => ({
            value: String(item.id),
            label: String(item.name),
            family: classifyFamily(String(item.category_key || "").toLowerCase(), String(item.name)),
          }))
      : [];

    if (apiTypeOptions.length > 0) {
      return [
        { value: "all", label: activeFamily === "financial" ? "All financial types" : activeFamily === "leave" ? "All leave types" : "All request subtypes" },
        ...apiTypeOptions
          .filter((item) => activeFamily === "all" || item.family === activeFamily)
          .map(({ value, label }) => ({ value, label })),
      ];
    }

    const inferred = new Map<string, string>();
    allRows.forEach((row) => {
      if (row.requestTypeId && row.type && (activeFamily === "all" || row.family === activeFamily)) {
        inferred.set(row.requestTypeId, row.type);
      }
    });
    return [
      { value: "all", label: activeFamily === "financial" ? "All financial types" : activeFamily === "leave" ? "All leave types" : "All request subtypes" },
      ...Array.from(inferred.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [activeFamily, allRows, requestTypes]);

  const statusOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        allRows
          .filter((row) => activeFamily === "all" || row.family === activeFamily)
          .map((row) => row.statusKey)
          .filter(Boolean)
      )
    );
    return [
      { value: "", label: "All statuses" },
      ...values.map((value) => ({ value, label: toTitleCase(value) })),
    ];
  }, [activeFamily, allRows]);

  const projectOptions = useMemo(() => {
    const values = new Map<string, string>();
    allRows.forEach((row) => {
      if (row.projectId || row.projectName) {
        values.set(row.projectId || row.projectName, row.projectName || row.projectId);
      }
    });
    return [
      { value: "", label: "All projects" },
      ...Array.from(values.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [allRows]);

  const teamOptions = useMemo(() => {
    const values = new Map<string, string>();
    allRows.forEach((row) => {
      if (row.teamId || row.teamName) {
        values.set(row.teamId || row.teamName, row.teamName || row.teamId);
      }
    });
    return [
      { value: "", label: "All teams" },
      ...Array.from(values.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [allRows]);

  const organizationOptions = useMemo(() => {
    const values = new Map<string, string>();
    organizations.forEach((organization) => {
      values.set(organization.id, organization.name);
    });
    allRows.forEach((row) => {
      if (row.organizationId || row.organizationName) {
        values.set(row.organizationId || row.organizationName, row.organizationName || row.organizationId);
      }
    });
    return [
      { value: "", label: "All organizations" },
      ...Array.from(values.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [allRows, organizations]);

  const dateLabel = useMemo(() => {
    if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`;
    if (dateFrom) return `From ${dateFrom}`;
    if (dateTo) return `Until ${dateTo}`;
    return "Any date";
  }, [dateFrom, dateTo]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (activeFamily !== "all" && row.family !== activeFamily) {
        return false;
      }

      if (status && row.statusKey !== status) {
        return false;
      }

      if (selectedRequestTypeId !== "all" && row.requestTypeId !== selectedRequestTypeId) {
        return false;
      }

      if (dateFrom) {
        const createdKey = dateOnlyKey(row.createdAtIso);
        if (!createdKey || createdKey < dateFrom) {
          return false;
        }
      }

      if (dateTo) {
        const createdKey = dateOnlyKey(row.createdAtIso);
        if (!createdKey || createdKey > dateTo) {
          return false;
        }
      }

      if (search.trim()) {
        const haystack = [
          row.id,
          row.type,
          row.projectName,
          row.teamName,
          row.organizationName,
          row.purpose,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) {
          return false;
        }
      }

      if (
        activeFamily !== "leave" &&
        selectedProject &&
        row.projectId !== selectedProject &&
        row.projectName !== selectedProject
      ) {
        return false;
      }

      if (
        activeFamily === "financial" &&
        selectedTeam &&
        row.teamId !== selectedTeam &&
        row.teamName !== selectedTeam
      ) {
        return false;
      }

      if (selectedOrganization && row.organizationId !== selectedOrganization && row.organizationName !== selectedOrganization) {
        return false;
      }

      return true;
    });
  }, [
    allRows,
    dateFrom,
    dateTo,
    activeFamily,
    search,
    selectedOrganization,
    selectedProject,
    selectedRequestTypeId,
    selectedTeam,
    status,
  ]);

  const sortedRows = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredRows].sort((first, second) => {
      if (sortBy === "created_at") {
        return ((new Date(first.createdAtIso || 0).getTime() - new Date(second.createdAtIso || 0).getTime()) || 0) * direction;
      }
      if (sortBy === "request_number") {
        return first.id.localeCompare(second.id, undefined, { numeric: true }) * direction;
      }
      if (sortBy === "total_amount") {
        return (first.totalAmount - second.totalAmount) * direction;
      }
      if (sortBy === "status") {
        return first.status.localeCompare(second.status) * direction;
      }
      return first.type.localeCompare(second.type) * direction;
    });
  }, [filteredRows, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sortedRows.slice(start, start + perPage);
  }, [sortedRows, safePage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, selectedRequestTypeId, dateFrom, dateTo, activeScope, activeFamily, search, selectedProject, selectedTeam, selectedOrganization, sortBy, sortOrder, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => [
      { label: "Total Requests", value: String(filteredRows.length), tone: "neutral" as const },
      {
        label: "Pending Action",
        value: String(filteredRows.filter((row) => isPendingLike(row)).length),
        tone: "pending" as const,
      },
      {
        label: "Completed",
        value: String(filteredRows.filter((row) => isCompletedLike(row)).length),
        tone: "success" as const,
      },
    ],
    [filteredRows]
  );

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel={activeScope === "approvals" ? "Approvals" : "My Requests"}
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={requestsMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[
            { label: "Requests" },
            { label: activeScope === "approvals" ? "Approvals" : "My Requests" },
          ]}
          title={activeScope === "approvals" ? "Approvals" : "My Requests"}
          description={
            activeScope === "approvals"
              ? "Review requests awaiting your decision."
              : "Track and manage your operational submissions."
          }
          actions={
            <Link to="/requests/new" className="inline-flex">
              <Button className="gap-2">
                <Icon name="add" className="text-[18px]" />
                New Request
              </Button>
            </Link>
          }
        />

        <nav className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
          {[
            { key: "all" as const, label: "All" },
            { key: "financial" as const, label: "Financial" },
            { key: "leave" as const, label: "Leave" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set("family", tab.key);
                setSearchParams(next);
              }}
              className={[
                "rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                activeFamily === tab.key ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  tone={stat.tone}
                />
              ))}
            </div>

            <ListFilters
              activeFamily={activeFamily}
              status={status}
              statusOptions={statusOptions}
              onStatusChange={setStatus}
              requestTypes={requestTypeOptions}
              selectedRequestTypeId={selectedRequestTypeId}
              onRequestTypeChange={setSelectedRequestTypeId}
              dateLabel={dateLabel}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              moreFiltersOpen={moreFiltersOpen}
              onToggleMoreFilters={() => setMoreFiltersOpen((value) => !value)}
              dateRangeOpen={dateRangeOpen}
              onToggleDateRange={() => setDateRangeOpen((value) => !value)}
              search={search}
              onSearchChange={setSearch}
              projectOptions={projectOptions}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
              teamOptions={teamOptions}
              selectedTeam={selectedTeam}
              onTeamChange={setSelectedTeam}
              organizationOptions={organizationOptions}
              selectedOrganization={selectedOrganization}
              onOrganizationChange={setSelectedOrganization}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
            <RequestsListTable
              activeFamily={activeFamily}
              rows={requestsError ? [] : pagedRows}
              loading={loadingRequests}
              error={requestsError}
              currentPage={safePage}
              totalPages={totalPages}
              totalCount={filteredRows.length}
              perPage={perPage}
              onPerPageChange={setPerPage}
              onPageChange={setCurrentPage}
              onRetry={() => {
                void refetchRequests();
              }}
            />

            <EfficientApprovalsCard />
          </div>

          <RightRail className="xl:col-span-4">
            <HelpPanel />
            <SectionCard title="Quick Actions">
              <ActivityFeed
                items={[
                  {
                    title: "Draft a new request",
                    description: "Start a financial or leave request from the request center.",
                    time: "Now",
                    tone: "pending",
                    icon: "add",
                  },
                  {
                    title: canSeeApprovals ? "Check pending approvals" : "Review request activity",
                    description: canSeeApprovals
                      ? "Review what needs your attention today."
                      : "Track your latest submissions and actions.",
                    time: "Later",
                    tone: "success",
                    icon: "task_alt",
                  },
                ]}
              />
            </SectionCard>
          </RightRail>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Staff Portal
          </p>
          <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">
            {activeScope === "approvals" ? "Approvals" : "My Requests"}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Active"
            value={String(filteredRows.filter((row) => row.tone === "pending" || row.tone === "warning").length)}
            tone="neutral"
          />
          <StatCard
            label="Approved"
            value={String(filteredRows.filter((row) => row.tone === "success").length)}
            tone="success"
          />
        </div>

        <section className="section-card p-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: "All" },
              { key: "financial" as const, label: "Financial" },
              { key: "leave" as const, label: "Leave" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set("family", item.key);
                  setSearchParams(next);
                }}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  activeFamily === item.key ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <RequestsMobileList
          rows={pagedRows}
          loading={loadingRequests}
          error={requestsError}
          onRetry={() => {
            void refetchRequests();
          }}
        />
        <section className="section-card flex items-center justify-between p-3 text-sm text-slate-600">
          <select
            value={perPage}
            onChange={(event) => setPerPage(Number(event.target.value))}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </button>
        </section>

        <section className="section-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-900 text-white">
              <Icon name="help" className="text-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Need help with a request?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Our support team is available 24/7 for operational queries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default RequestsListPage;
