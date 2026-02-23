import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import PasswordInput from "@/components/Auth/PasswordInput";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createUser, listRoleOptions, type RoleOption } from "@/services/users";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";

type CreateUserForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  type: string;
  primary_organization_id: string;
};

const initialCreateForm: CreateUserForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  type: "staff",
  primary_organization_id: "",
};

function UserCreatePage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["staff"]);
  const [form, setForm] = useState<CreateUserForm>(initialCreateForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    void Promise.all([listRoleOptions(), listOrganizations({ is_active: true })])
      .then(([roleOptions, orgOptions]) => {
        setRoles(roleOptions);
        setOrganizations(orgOptions);
      })
      .catch(() => []);
  }, []);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const onCreateUser = async () => {
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

    try {
      setSaving(true);
      await createUser({
        username: form.username,
        email: form.email,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        password: form.password || undefined,
        type: form.type || undefined,
        roles: selectedRoles,
        primary_organization_id: form.primary_organization_id || undefined,
      });
      navigate("/app/admin/users", { replace: true });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to create user.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Create User</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5 space-y-3">
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
          <FormLabel>Password (optional)</FormLabel>
          <PasswordInput value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
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
          <Button variant="primary" disabled={saving} onClick={() => void onCreateUser()}>
            {saving ? "Creating..." : "Create User"}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/app/admin/users")}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

export default UserCreatePage;
