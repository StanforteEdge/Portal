import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthProvider";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useCachedQuery, httpRequest, resourceApi } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { BulkImportDashboard, type BulkColumnSchema } from "@/shared/components/feedback/BulkImportDashboard";

export default function AdminUserBulkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: organizations } = useCachedQuery(
    "admin:users:organizations",
    () => resourceApi.listOrganizations(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const orgItems = (organizations as any)?.data?.items || [];
  const orgOptions = Array.isArray(orgItems)
    ? orgItems.map((o: any) => ({ value: String(o.id), label: o.name }))
    : [];

  const columns: BulkColumnSchema[] = [
    { key: "first_name", label: "First Name", placeholder: "e.g., John", required: true },
    { key: "last_name", label: "Last Name", placeholder: "e.g., Doe", required: true },
    { key: "email", label: "Email Address", placeholder: "e.g., john@company.com", required: true },
    { key: "username", label: "Username", placeholder: "e.g., johndoe (optional)" },
    {
      key: "type",
      label: "Role Type",
      type: "select",
      options: [
        { value: "staff", label: "Staff" },
        { value: "vendor", label: "Vendor" },
        { value: "client", label: "Client" },
        { value: "board_member", label: "Board Member" }
      ],
      required: true
    },
    {
      key: "primary_organization_id",
      label: "Organization",
      type: "select",
      options: orgOptions,
      required: true
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending" },
        { value: "suspended", label: "Suspended" }
      ],
      required: true
    }
  ];

  const sampleUsers = [
    {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@stanforteedge.com",
      username: "janesmith",
      type: "staff",
      primary_organization_id: orgOptions[0]?.value || "",
      status: "active"
    }
  ];

  const handleSubmitBulk = async (dataList: any[]) => {
    return await httpRequest<{
      successCount: number;
      failedCount: number;
      results: { identifier: string; status: "success" | "failed"; error?: string }[];
    }>("/admin/users/bulk", {
      method: "POST",
      body: { users: dataList }
    });
  };

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-users"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <BulkImportDashboard
        title="Bulk Import Users"
        description="Download the template, upload a CSV file, or add rows manually to stage user accounts for registration."
        columns={columns}
        sampleData={sampleUsers}
        onSubmit={handleSubmitBulk}
        onCancel={() => navigate("/admin/users")}
      />
    </AppShell>
  );
}
