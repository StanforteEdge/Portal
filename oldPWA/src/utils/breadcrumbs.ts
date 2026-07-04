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
  attendance: "Attendance",
  leave: "Leave Tracker",
  employee: "Employee",
  users: "Users",
  forms: "Forms",
  form: "Form",
  roles: "Roles & Permissions",
  policies: "Policies",
  list: "List",
};

const PATH_LABELS: Record<string, string> = {
  "/appOld/hr/settings": "Attendance Settings",
  "/appOld/hr/settings/leave": "Leave Settings",
  "/appOld/hr/leave": "Leave Tracker",
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
  if (!parts.length) return [{ label: "Dashboard", path: "/appOld/dashboard" }];

  const crumbs: BreadcrumbItem[] = [];
  let acc = "";

  for (const part of parts) {
    acc += `/${part}`;
    if (part === "app") {
      crumbs.push({ label: "Dashboard", path: "/appOld/dashboard" });
      continue;
    }
    crumbs.push({ label: formatLabel(part), path: acc });
  }

  const normalized = crumbs.length ? crumbs : [{ label: "Dashboard", path: "/appOld/dashboard" }];
  const deduped = normalized.filter((crumb, index, all) => index === 0 || crumb.path !== all[index - 1].path);
  const labelled = deduped.map((crumb) => ({
    ...crumb,
    label: PATH_LABELS[crumb.path] ?? crumb.label,
  }));

  if (labelled.length <= 2) return labelled;
  return [labelled[0], labelled[labelled.length - 1]];
}
