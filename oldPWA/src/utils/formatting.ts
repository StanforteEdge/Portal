import dayjs from "dayjs";

export function formatDisplayDate(value?: string | null, fallback = "-") {
  if (!value) return fallback;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return fallback;
  return parsed.format("DD MMM YYYY");
}

export function formatRequestNumber(value: string) {
  if (!value) return value;
  const parts = value.split("/");
  if (parts.length < 3) return value;
  const last = parts[parts.length - 1];
  if (!/^\d+$/.test(last)) return value;
  parts[parts.length - 1] = last.padStart(3, "0");
  return parts.join("/");
}

export function statusBadgeClass(status: string) {
  const key = (status || "").toLowerCase();
  if (["completed", "cleared", "disbursed", "approved"].includes(key)) return "bg-success/20 text-success";
  if (["approval", "sent", "confirmed", "retired", "pending"].includes(key)) return "bg-warning/20 text-warning";
  if (["rejected", "cancelled"].includes(key)) return "bg-danger/20 text-danger";
  return "bg-slate-200 text-slate-700";
}

export function formatMoney(
  value?: number | string | null,
  fallback = "-",
  currency = "NGN"
) {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPersonName(
  person?: {
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
  } | null
) {
  if (!person) return "-";
  const first = person.first_name ?? person.firstName ?? "";
  const last = person.last_name ?? person.lastName ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (person.username) return person.username;
  return person.email || "-";
}

export function formatPaymentMethod(value?: string | null) {
  if (!value) return "-";
  const key = String(value).trim().toLowerCase();
  const labels: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    mobile_money: "Mobile Money",
    cheque: "Cheque",
    card: "Card",
    pos: "POS",
    transfer: "Transfer",
    other: "Other",
  };
  if (labels[key]) return labels[key];
  return key
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
