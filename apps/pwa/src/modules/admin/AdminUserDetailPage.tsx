import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getAdminUser,
  getAdminUserRoles,
  updateAdminUser,
  updateAdminUserStatus,
  setAdminUserRoles,
  sendUserInvite,
  listRoleOptions,
  type AdminUserRole,
  type RoleOption,
} from "./admin-users-api";

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const typeLabel: Record<string, string> = {
  staff: "Staff",
  vendor: "Vendor",
  client: "Client",
  board_member: "Board Member",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: adminUser, loading: userLoading } = useCachedQuery(
    `admin:users:${id ?? ""}`,
    () => getAdminUser(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: rolesData, loading: rolesLoading } = useCachedQuery(
    `admin:users:${id ?? ""}:roles`,
    () => getAdminUserRoles(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  // Edit form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  useEffect(() => {
    listRoleOptions().then(setRoleOptions).catch(() => setRoleOptions([]));
  }, []);

  useEffect(() => {
    if (adminUser) {
      setFirstName(adminUser.first_name ?? "");
      setLastName(adminUser.last_name ?? "");
    }
  }, [adminUser]);

  useEffect(() => {
    const currentRoles: AdminUserRole[] = rolesData?.roles ?? [];
    const primary = currentRoles.find((r) => r.is_primary);
    if (primary) setSelectedRole(primary.slug);
  }, [rolesData]);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  const displayName =
    [adminUser?.first_name, adminUser?.last_name].filter(Boolean).join(" ") ||
    adminUser?.email ||
    "-";

  async function handleSaveInfo() {
    try {
      setInfoSaving(true);
      await updateAdminUser(id!, {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      showToast({ tone: "success", title: "Saved", message: "User details updated." });
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setInfoSaving(false);
    }
  }

  async function handleSaveRole() {
    try {
      setRoleSaving(true);
      await setAdminUserRoles(id!, selectedRole ? [selectedRole] : []);
      showToast({ tone: "success", title: "Role updated", message: "User role has been updated." });
    } catch (err) {
      showToast({ tone: "danger", title: "Role update failed", message: err instanceof Error ? err.message : "Unable to update role." });
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleSendInvite() {
    try {
      setInviteSending(true);
      await sendUserInvite(id!);
      showToast({ tone: "success", title: "Invite sent", message: `Invitation email sent to ${adminUser?.email}.` });
    } catch (err) {
      showToast({ tone: "danger", title: "Invite failed", message: err instanceof Error ? err.message : "Unable to send invite." });
    } finally {
      setInviteSending(false);
    }
  }

  async function handleStatusChange(status: "active" | "suspended") {
    try {
      setStatusSaving(true);
      await updateAdminUserStatus(id!, { status });
      showToast({ tone: "success", title: "Status updated", message: `User is now ${status}.` });
    } catch (err) {
      showToast({ tone: "danger", title: "Status update failed", message: err instanceof Error ? err.message : "Unable to update status." });
    } finally {
      setStatusSaving(false);
    }
  }

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
      <PageHeader
        breadcrumbs={[
          { label: "Administration" },
          { label: "Users", path: "/admin/users" },
          { label: displayName },
        ]}
        title={displayName}
        description={adminUser?.email ?? ""}
      />

      {userLoading ? (
        <div className="text-sm text-slate-500">Loading user...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Identity */}
            <SectionCard title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <TextField label="Email" value={adminUser?.email ?? ""} readOnly />
                <TextField
                  label="Type"
                  value={typeLabel[adminUser?.type ?? ""] ?? adminUser?.type ?? "-"}
                  readOnly
                />
              </div>
              <Button
                className="mt-4"
                onClick={() => void handleSaveInfo()}
                disabled={infoSaving}
              >
                {infoSaving ? "Saving..." : "Save Details"}
              </Button>
            </SectionCard>

            {/* Roles */}
            <SectionCard title="Role">
              {rolesLoading ? (
                <div className="text-sm text-slate-500">Loading roles...</div>
              ) : (
                <>
                  <SelectField
                    label="Assigned Role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">No role</option>
                    {roleOptions.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name}
                      </option>
                    ))}
                  </SelectField>
                  <Button
                    className="mt-4"
                    onClick={() => void handleSaveRole()}
                    disabled={roleSaving}
                  >
                    {roleSaving ? "Saving..." : "Update Role"}
                  </Button>
                </>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            {/* Status card */}
            <SectionCard title="Account Status">
              <div className="mb-4">
                <Chip variant={statusVariant[adminUser?.status ?? ""] ?? "neutral"}>
                  {adminUser?.status ?? "-"}
                </Chip>
              </div>
              <div className="flex flex-col gap-2">
                {adminUser?.status !== "active" ? (
                  <Button
                    onClick={() => void handleStatusChange("active")}
                    disabled={statusSaving}
                  >
                    Activate
                  </Button>
                ) : null}
                {adminUser?.status === "active" ? (
                  <Button
                    variant="danger"
                    onClick={() => void handleStatusChange("suspended")}
                    disabled={statusSaving}
                  >
                    Suspend
                  </Button>
                ) : null}
              </div>
            </SectionCard>

            {/* Invite */}
            <SectionCard title="Invitation">
              <p className="mb-4 text-sm text-slate-600">
                {adminUser?.status === "pending"
                  ? "This user has not accepted their invite yet."
                  : "Resend if the user needs a new login link."}
              </p>
              <Button
                variant="secondary"
                onClick={() => void handleSendInvite()}
                disabled={inviteSending}
              >
                <Icon name="mail" className="mr-2 text-[18px]" />
                {inviteSending ? "Sending..." : "Send / Resend Invite"}
              </Button>
            </SectionCard>

            {/* Link to HR profile for staff */}
            {adminUser?.type === "staff" ? (
              <SectionCard title="Employee Profile">
                <p className="mb-3 text-sm text-slate-600">
                  This user has a staff account. HR can complete their employee
                  profile.
                </p>
                <Link to="/hr/employees">
                  <Button variant="ghost">
                    <Icon name="person" className="mr-2 text-[18px]" />
                    View in HR
                  </Button>
                </Link>
              </SectionCard>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
