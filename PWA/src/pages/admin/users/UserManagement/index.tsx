import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import { inviteUser, listUsers, type UserListItem } from "@/services/users";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";

function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

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

  useEffect(() => {
    void loadUsers(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Button variant="primary" onClick={() => navigate("/app/admin/users/new")}>
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12">
          {notice ? <AppNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <div className="col-span-12">
          <div className="intro-y box">
            <div className="flex flex-col gap-3 p-5 border-b sm:flex-row sm:items-center border-slate-200/60 dark:border-darkmode-400">
              <h3 className="mr-auto text-base font-medium">Users ({total})</h3>
              <div className="flex gap-2">
                <FormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name/email/username"
                />
                <Button variant="outline-primary" onClick={() => void loadUsers(1, search)}>
                  Search
                </Button>
              </div>
            </div>

            <div className="p-5 overflow-x-auto">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 rounded bg-slate-200"></div>
                  <div className="h-4 rounded bg-slate-100"></div>
                  <div className="h-4 rounded bg-slate-100"></div>
                </div>
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
                        <Table.Td>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}</Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>{user.username}</Table.Td>
                        <Table.Td>{user.type}</Table.Td>
                        <Table.Td>{user.status}</Table.Td>
                        <Table.Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => navigate(`/app/admin/users/${user.id}/roles`)}
                            >
                              Roles
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={invitingUserId === user.id}
                              onClick={() => void onInvite(user.id)}
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
                onClick={() => void loadUsers(page - 1, search)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} of {lastPage}
              </span>
              <Button
                variant="outline-secondary"
                disabled={page >= lastPage}
                onClick={() => void loadUsers(page + 1, search)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserManagementPage;
