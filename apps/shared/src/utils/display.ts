import type { AuthUser } from "../auth/types";

const ROLE_PRIORITY = [
  "ed",
  "coo",
  "administrator",
  "admin",
  "finance_manager",
  "finance_officer",
  "finance_auditor",
  "accountant",
  "team_lead",
  "staff",
] as const;

export function humanize(value?: string | null, fallback = "-") {
  if (!value) return fallback;
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function roleLabel(role?: string | null) {
  const key = String(role || "").trim().toLowerCase();
  const labels: Record<string, string> = {
    administrator: "Administrator",
    finance_manager: "Finance Manager",
    finance_officer: "Finance Officer",
    finance_auditor: "Finance Auditor",
    accountant: "Accountant",
    staff: "Staff",
    admin: "Admin",
    team_lead: "Team Lead",
    coo: "Chief Operating Officer",
    ed: "Executive Director",
  };
  return labels[key] || humanize(key, "");
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diff = Math.abs(diffMs);
  const tense = diffMs >= 0 ? "ago" : "from now";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) {
    const count = Math.round(diff / minute);
    return `${count} minute${count === 1 ? "" : "s"} ${tense}`;
  }
  if (diff < day) {
    const count = Math.round(diff / hour);
    return `${count} hour${count === 1 ? "" : "s"} ${tense}`;
  }
  const count = Math.round(diff / day);
  return `${count} day${count === 1 ? "" : "s"} ${tense}`;
}

export function userDisplayName(user?: Pick<AuthUser, "first_name" | "last_name" | "username" | "email"> | null, fallback = "Staff User") {
  const firstName = user?.first_name?.trim();
  const lastName = user?.last_name?.trim();
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name;
}

export function userFirstName(user?: Pick<AuthUser, "first_name"> | null, fallback = "Staff User") {
  const firstName = user?.first_name?.trim();
  return firstName || fallback;
}

export function userFullname(user?: Pick<AuthUser, "first_name" | "last_name"> | null, fallback = "Staff User") {
  const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();
  return name || fallback;
}

export function userInitials(user?: Pick<AuthUser, "first_name" | "last_name"> | null) {
  const firstInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : "";
  const lastInitial = user?.last_name ? user.last_name.charAt(0).toUpperCase() : "";
  const initials = `${firstInitial}${lastInitial}`;
  return initials || null;
}

export function sortRoles(roles: string[]) {
  return [...roles].sort((left, right) => {
    const leftIndex = ROLE_PRIORITY.indexOf(left as (typeof ROLE_PRIORITY)[number]);
    const rightIndex = ROLE_PRIORITY.indexOf(right as (typeof ROLE_PRIORITY)[number]);
    const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    if (safeLeft !== safeRight) return safeLeft - safeRight;
    return left.localeCompare(right);
  });
}
