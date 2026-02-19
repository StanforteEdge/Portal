export type BreadcrumbItem = {
  label: string;
  path: string;
};

const LABELS: Record<string, string> = {
  app: "Dashboard",
  dashboard: "Dashboard",
  profile: "Profile",
  media: "My Media",
  documents: "Documents",
  onboarding: "Onboarding",
  requests: "Requests",
  create: "Create",
  new: "New",
  request: "Request",
  approvals: "Approvals",
  finance: "Finance",
  manualentry: "Manual Entry",
  "manual-entry": "Manual Entry",
  settings: "Settings",
  security: "Security",
  admin: "Admin",
  hr: "HR",
  employees: "Employees",
  employee: "Employee",
  users: "Users",
  forms: "Forms",
  form: "Form",
  roles: "Roles & Permissions",
  list: "List",
};

function formatLabel(segment: string) {
  const key = segment.toLowerCase();
  if (LABELS[key]) return LABELS[key];
  if (/^\d+$/.test(segment)) return "Detail";
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detail";
  return key
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function buildAppBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return [{ label: "Dashboard", path: "/app/dashboard" }];

  const crumbs: BreadcrumbItem[] = [];
  let acc = "";

  for (const part of parts) {
    acc += `/${part}`;
    if (part === "app") {
      crumbs.push({ label: "Dashboard", path: "/app/dashboard" });
      continue;
    }
    crumbs.push({ label: formatLabel(part), path: acc });
  }

  return crumbs.length ? crumbs : [{ label: "Dashboard", path: "/app/dashboard" }];
}
