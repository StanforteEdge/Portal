import { useEffect, useState } from "react";
import {
  Button,
  SectionCard,
  SelectField,
  TextField,
  useToast,
} from "@/shared";
import { listOrganizations, type OrganizationRecord } from "@/shared/api/organization-api";
import {
  createAdminUser,
  setAdminUserRoles,
  sendUserInvite,
  listRoleOptions,
  type RoleOption,
} from "./admin-users-api";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AdminUserCreateSlideOver({ onClose, onCreated }: Props) {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [type, setType] = useState("staff");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [orgId, setOrgId] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    listOrganizations({ is_active: true }).then(setOrgs).catch(() => setOrgs([]));
    listRoleOptions().then(setRoles).catch(() => setRoles([]));
  }, []);

  async function handleSubmit() {
    if (!email.trim()) {
      showToast({ tone: "warning", title: "Email required", message: "Please enter a valid email address." });
      return;
    }
    try {
      setSaving(true);
      const user = await createAdminUser({
        email: email.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        type,
        status: "pending",
        primary_organization_id: orgId || undefined,
      });
      if (selectedRole) {
        await setAdminUserRoles(user.id, [selectedRole]);
      }
      if (sendInvite) {
        await sendUserInvite(user.id);
      }
      showToast({
        tone: "success",
        title: "User created",
        message: sendInvite
          ? `Invite sent to ${user.email}.`
          : `${user.email} created. Send invite when ready.`,
      });
      onCreated();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Create failed",
        message: err instanceof Error ? err.message : "Unable to create user.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              New User
            </p>
            <h2 className="text-xl font-semibold text-slate-950">Add User</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Identity">
            <div className="grid gap-4">
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Access">
            <div className="grid gap-4">
              <SelectField
                label="User Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="staff">Staff / Employee</option>
                <option value="vendor">Vendor</option>
                <option value="client">Client</option>
                <option value="board_member">Board Member</option>
              </SelectField>

              <SelectField
                label="Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">No role</option>
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Primary Organisation"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">Select organisation…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.code ? `(${o.code})` : ""}
                  </option>
                ))}
              </SelectField>
            </div>
          </SectionCard>

          <SectionCard title="Invite">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                Send invitation email immediately
              </span>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              The user will receive a link to set their password. If unchecked, you
              can send the invite later from their profile.
            </p>
            {type === "staff" ? (
              <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-900">
                A draft employee profile will be created in HR for HR to complete.
              </p>
            ) : null}
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Creating…" : "Create User"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
