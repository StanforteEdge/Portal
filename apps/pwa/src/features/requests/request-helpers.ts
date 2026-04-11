import { formatCurrency } from "@stanforte/shared";
import type { RequestRecord, RequestTypeOption } from "@/features/requests/requests-api";

export type RequestFamily = "financial" | "leave" | "other";

export function classifyRequestFamily(categoryKey?: string | null, requestTypeName?: string | null): RequestFamily {
  const category = String(categoryKey || "").toLowerCase();
  const name = String(requestTypeName || "").toLowerCase();

  if (category) {
    if (category.includes("leave")) return "leave";
    if (
      category.includes("finance") ||
      category.includes("payment") ||
      category.includes("expense") ||
      category.includes("reimbursement") ||
      category.includes("procurement")
    ) {
      return "financial";
    }
    return "other";
  }

  if (name.includes("leave")) return "leave";

  if (name.includes("cash") || name.includes("expense") || name.includes("financial") || name.includes("reimbursement") || name.includes("procurement")) {
    return "financial";
  }

  return "other";
}

export function requestFamilyLabel(family: RequestFamily) {
  if (family === "leave") return "Leave";
  if (family === "financial") return "Financial";
  return "Other";
}

export function requestFamilyFromType(type?: RequestTypeOption | null): RequestFamily {
  return classifyRequestFamily(type?.categoryKey ?? type?.category_key, type?.name);
}

export function requestFamilyFromRecord(request?: RequestRecord | null): RequestFamily {
  return classifyRequestFamily(request?.request_type?.category_key, request?.request_type?.name);
}

export function formatRequestStatus(status?: string | null) {
  return String(status || "draft").replaceAll("_", " ");
}

export function formatViewerRequestStatus(
  status?: string | null,
  actions: string[] = [],
  pendingStep?: string | null
) {
  const normalizedActions = actions.map((entry) => entry.toLowerCase());
  if (normalizedActions.includes("approve") || normalizedActions.includes("reject")) {
    return "Awaiting Your Approval";
  }
  if (normalizedActions.includes("submit")) {
    return "Draft";
  }
  if (normalizedActions.includes("confirm")) {
    return "Awaiting Your Confirmation";
  }
  if (normalizedActions.includes("retire")) {
    return "Retirement Required";
  }
  if (normalizedActions.includes("complete")) {
    return "Ready to Close";
  }
  if (pendingStep && ["approval", "submitted", "sent", "under_review", "review"].includes(String(status || "").toLowerCase())) {
    return `Awaiting ${pendingStep}`;
  }
  return formatRequestStatus(status);
}

export function requestStatusTone(status?: string | null): "success" | "warning" | "pending" | "danger" | "neutral" {
  const key = String(status || "").toLowerCase();
  if (["approved", "completed", "paid", "disbursed", "confirmed"].includes(key)) return "success";
  if (["rejected", "cancelled", "voided"].includes(key)) return "danger";
  if (["under_review", "review", "draft", "prepared"].includes(key)) return "warning";
  if (["pending", "sent", "approval", "submitted"].includes(key)) return "pending";
  return "neutral";
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPersonName(person?: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
} | null) {
  const name = `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
  if (name) return name;
  return person?.username || person?.email || "Unknown requester";
}
