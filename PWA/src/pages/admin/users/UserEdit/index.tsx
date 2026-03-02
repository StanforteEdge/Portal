import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import PasswordInput from "@/components/Auth/PasswordInput";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getUser, getUserRoles, listRoleOptions, setUserRoles, updateUser, type RoleOption } from "@/services/users";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";

type EditUserForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "pending";
  set_password: boolean;
  password: string;
  send_invite: boolean;
  send_welcome_email: boolean;
  type: string;
  primary_organization_id: string;
};

const initialForm: EditUserForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  status: "active",
  set_password: false,
  password: "",
  send_invite: false,
  send_welcome_email: false,
  type: "staff",
  primary_organization_id: "",
};

function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [form, setForm] = useState<EditUserForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([listRoleOptions(), listOrganizations({ is_active: true }), getUser(id)])
      .then(([roleOptions, orgOptions, user]) => {
        setRoles(roleOptions);
        setOrganizations(orgOptions);
        setSelectedRoles([]);
        setForm({
          username: user.username || "",
          email: user.email || "",
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          status: user.status === "active" ? "active" : "pending",
          set_password: false,
          password: "",
          send_invite: false,
          send_welcome_email: false,
          type: user.type || "staff",
          primary_organization_id: user.primaryOrganizationId ? String(user.primaryOrganizationId) : "",
        });
      })
      .catch(() => setNotice({ tone: "error", message: "Unable to load user details." }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void getUserRoles(id)
      .then((userRoles) => setSelectedRoles(userRoles.roles.map((role) => role.slug)))
      .catch(() => []);
  }, [id]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const onUpdateUser = async () => {
    if (!id) return;
    if (!form.username || !form.email) {
      setNotice({ tone: "warning", message: "Username and email are required." });
      return;
    }
    if (selectedRoles.length === 0) {
      setNotice({ tone: "warning", message: "Select at least one role." });
      return;
    }
    if (form.type === "staff" && !form.primary_organization_id) {
      setNotice({ tone: "warning", message: "Primary organization is required for staff." });
      return;
    }
    if (form.set_password && !form.password.trim()) {
      setNotice({ tone: "warning", message: "Password is required when \"Set password\" is enabled." });
      return;
    }
    if (form.status === "active" && !form.set_password && !form.send_invite) {
      setNotice({
        tone: "warning",
        message: "Active users need a password or invite link to access their account.",
      });
      return;
    }

    try {
      setSaving(true);
      await updateUser(id, {
        username: form.username,
        email: form.email,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        password: form.set_password ? form.password || undefined : undefined,
        set_password: form.set_password,
        status: form.status,
        send_invite: form.send_invite,
        send_welcome_email: form.send_welcome_email,
        type: form.type || undefined,
        primary_organization_id: form.primary_organization_id || undefined,
      });
      await setUserRoles(id, selectedRoles);
      navigate("/app/admin/users", { replace: true });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to update user.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Edit User</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5 space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-slate-200"></div>
            <div className="h-4 rounded bg-slate-100"></div>
            <div className="h-4 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div>
              <FormLabel>Username</FormLabel>
              <FormInput value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <FormInput type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>First Name</FormLabel>
                <FormInput value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Last Name</FormLabel>
                <FormInput value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "active" | "pending" }))}>
                <option value="pending">pending</option>
                <option value="active">active</option>
              </FormSelect>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.set_password}
                  onChange={(e) => setForm((prev) => ({ ...prev, set_password: e.target.checked, password: e.target.checked ? prev.password : "" }))}
                />
                <span>Set password now</span>
              </label>
            </div>
            {form.set_password ? (
              <div>
                <FormLabel>Password</FormLabel>
                <PasswordInput value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.send_invite}
                  onChange={(e) => setForm((prev) => ({ ...prev, send_invite: e.target.checked }))}
                />
                <span>Send invite email</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.send_welcome_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, send_welcome_email: e.target.checked }))}
                />
                <span>Send welcome email</span>
              </label>
            </div>
            <div>
              <FormLabel>User Type</FormLabel>
              <FormSelect value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
                <option value="contractor">contractor</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Primary Organization</FormLabel>
              <FormSelect
                value={form.primary_organization_id}
                onChange={(e) => setForm((prev) => ({ ...prev, primary_organization_id: e.target.value }))}
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Roles</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label key={role.slug} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.slug)}
                      onChange={() => toggleRole(role.slug)}
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" disabled={saving} onClick={() => void onUpdateUser()}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/app/admin/users")}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default UserEditPage;
