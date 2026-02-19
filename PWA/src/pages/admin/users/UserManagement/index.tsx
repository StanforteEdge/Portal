import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import {
  createUser,
  getUserRoles,
  inviteUser,
  listRoleOptions,
  listUsers,
  setUserRoles,
  type RoleOption,
  type UserListItem,
} from "@/services/users";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import PasswordInput from "@/components/Auth/PasswordInput";

type CreateUserForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  type: string;
};

const initialCreateForm: CreateUserForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  type: "staff",
};

function UserManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedCreateRoles, setSelectedCreateRoles] = useState<string[]>(["staff"]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserLabel, setSelectedUserLabel] = useState<string>("");
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [panelMode, setPanelMode] = useState<"create" | "roles" | null>(null);
  const [form, setForm] = useState<CreateUserForm>(initialCreateForm);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );
  const isPanelOpen = panelMode !== null;

  const loadUsers = async (nextPage = page, nextSearch = search) => {
    try {
      setLoading(true);
      const response = await listUsers({
        page: nextPage,
        per_page: 15,
        search: nextSearch || undefined,
      });
      setUsers(response.data);
      setPage(response.meta.page);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load users.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const data = await listRoleOptions();
    setRoles(data);
  };

  useEffect(() => {
    void loadUsers(1, "");
    void loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRole = (
    role: string,
    target: "create" | "assign"
  ) => {
    if (target === "create") {
      setSelectedCreateRoles((prev) =>
        prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
      );
      return;
    }

    setSelectedUserRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const onCreateUser = async () => {
    if (!form.username || !form.email) {
      setNotice({ tone: "warning", message: "Username and email are required." });
      return;
    }
    if (selectedCreateRoles.length === 0) {
      setNotice({ tone: "warning", message: "Select at least one role for the user." });
      return;
    }

    try {
      setCreating(true);
      setNotice(null);
      await createUser({
        username: form.username,
        email: form.email,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        password: form.password || undefined,
        type: form.type || undefined,
        roles: selectedCreateRoles,
      });
      setNotice({ tone: "success", message: "User created successfully." });
      setForm(initialCreateForm);
      setSelectedCreateRoles(["staff"]);
      setPanelMode(null);
      await loadUsers(1, search);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to create user.",
      });
    } finally {
      setCreating(false);
    }
  };

  const onManageRoles = async (userId: string) => {
    try {
      const data = await getUserRoles(userId);
      const user = users.find((row) => row.id === userId);
      setSelectedUserId(userId);
      setSelectedUserLabel(user?.email || user?.username || userId);
      setSelectedUserRoles(data.roles.map((role) => role.slug));
      setPanelMode("roles");
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load user roles.",
      });
    }
  };

  const onSaveRoles = async () => {
    if (!selectedUserId) return;
    if (selectedUserRoles.length === 0) {
      setNotice({ tone: "warning", message: "Select at least one role." });
      return;
    }

    try {
      setSavingRoles(true);
      setNotice(null);
      await setUserRoles(selectedUserId, selectedUserRoles);
      setNotice({ tone: "success", message: "User roles updated." });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to update roles.",
      });
    } finally {
      setSavingRoles(false);
    }
  };

  const onInvite = async (userId: string) => {
    const message = window.prompt(
      "Optional invite message:",
      "Welcome to StanforteEdge. Use this link to activate your account."
    );
    if (message === null) return;

    try {
      setInvitingUserId(userId);
      setNotice(null);
      await inviteUser(userId, message || undefined);
      setNotice({ tone: "success", message: "Invite email sent." });
      await loadUsers(page, search);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to send invite.",
      });
    } finally {
      setInvitingUserId(null);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">User Management</h2>
        <Button
          variant="primary"
          onClick={() => {
            setPanelMode("create");
            setSelectedUserId(null);
          }}
        >
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12">
          {notice ? <AppNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <div className={isPanelOpen ? "col-span-12 lg:col-span-7" : "col-span-12"}>
          <div className="intro-y box">
            <div className="flex flex-col gap-3 p-5 border-b sm:flex-row sm:items-center border-slate-200/60 dark:border-darkmode-400">
              <h3 className="mr-auto text-base font-medium">Users ({total})</h3>
              <div className="flex gap-2">
                <FormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name/email/username"
                />
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    void loadUsers(1, search);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="p-5 overflow-x-auto">
              {loading ? (
                <div className="text-slate-500">Loading users...</div>
              ) : (
                <Table className="table-report" striped hover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th className="text-right">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          {[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}
                        </Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>{user.username}</Table.Td>
                        <Table.Td>{user.type}</Table.Td>
                        <Table.Td>{user.status}</Table.Td>
                        <Table.Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => {
                                void onManageRoles(user.id);
                              }}
                            >
                              Roles
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={invitingUserId === user.id}
                              onClick={() => {
                                void onInvite(user.id);
                              }}
                            >
                              {invitingUserId === user.id ? "Sending..." : "Invite"}
                            </Button>
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200/60 dark:border-darkmode-400">
              <Button
                variant="outline-secondary"
                disabled={page <= 1}
                onClick={() => {
                  void loadUsers(page - 1, search);
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} of {lastPage}
              </span>
              <Button
                variant="outline-secondary"
                disabled={page >= lastPage}
                onClick={() => {
                  void loadUsers(page + 1, search);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {isPanelOpen ? (
          <div className="col-span-12 lg:col-span-5">
            <div className="intro-y box">
              <div className="p-5 border-b border-slate-200/60 dark:border-darkmode-400 flex items-center">
                <h3 className="text-base font-medium mr-auto">
                  {panelMode === "create" ? "Create User" : `Roles: ${selectedUser?.email || selectedUserLabel}`}
                </h3>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setPanelMode(null)}
                >
                  Close
                </Button>
              </div>
              <div className="p-5 space-y-3">
                {panelMode === "create" ? (
                  <>
                    <div>
                      <FormLabel>Username</FormLabel>
                      <FormInput
                        value={form.username}
                        onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FormLabel>Email</FormLabel>
                      <FormInput
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FormLabel>First Name</FormLabel>
                        <FormInput
                          value={form.first_name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, first_name: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <FormLabel>Last Name</FormLabel>
                        <FormInput
                          value={form.last_name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, last_name: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <FormLabel>Temporary Password (optional)</FormLabel>
                      <PasswordInput
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FormLabel>User Type</FormLabel>
                      <FormSelect
                        value={form.type}
                        onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="staff">staff</option>
                        <option value="employee">employee</option>
                        <option value="contact">contact</option>
                      </FormSelect>
                    </div>
                    <div>
                      <FormLabel>Initial Roles</FormLabel>
                      <div className="grid grid-cols-1 gap-2 p-3 border rounded-md border-slate-200/60 dark:border-darkmode-400 max-h-64 overflow-auto">
                        {roles.map((role) => (
                          <label key={role.slug} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedCreateRoles.includes(role.slug)}
                              onChange={() => toggleRole(role.slug, "create")}
                            />
                            <span>{role.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button variant="primary" onClick={onCreateUser} disabled={creating}>
                      {creating ? "Creating..." : "Create User"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {roles.map((role) => (
                        <label key={role.slug} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedUserRoles.includes(role.slug)}
                            onChange={() => toggleRole(role.slug, "assign")}
                          />
                          <span>{role.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="primary"
                        onClick={() => {
                          void onSaveRoles();
                        }}
                        disabled={savingRoles}
                      >
                        {savingRoles ? "Saving..." : "Save Roles"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default UserManagementPage;
