import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getUserRoles, listRoleOptions, listUsers, setUserRoles, type RoleOption, type UserListItem } from "@/services/users";

function UserRolesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id || "";
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const user = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  useEffect(() => {
    const run = async () => {
      try {
        const [rolesData, usersData, userRoles] = await Promise.all([
          listRoleOptions(),
          listUsers({ page: 1, per_page: 200 }),
          getUserRoles(userId),
        ]);
        setRoles(rolesData);
        setUsers(usersData.data);
        setSelectedUserRoles(userRoles.roles.map((role) => role.slug));
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load user roles." });
      } finally {
        setLoading(false);
      }
    };
    if (userId) void run();
  }, [userId]);

  const toggleRole = (role: string) => {
    setSelectedUserRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const onSaveRoles = async () => {
    if (!userId) return;
    if (selectedUserRoles.length === 0) {
      setNotice({ tone: "warning", message: "Select at least one role." });
      return;
    }
    try {
      setSaving(true);
      await setUserRoles(userId, selectedUserRoles);
      navigate("/app/admin/users", { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update roles." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Manage Roles</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box p-5 mt-5">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-slate-200"></div>
            <div className="h-4 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-slate-600">
              User: <strong>{user?.email || user?.username || userId}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <label key={role.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUserRoles.includes(role.slug)}
                    onChange={() => toggleRole(role.slug)}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="primary" disabled={saving} onClick={() => void onSaveRoles()}>
                {saving ? "Saving..." : "Save Roles"}
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

export default UserRolesPage;
