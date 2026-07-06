import { useState, useEffect } from "react";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { httpRequest } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { AdminOrganizationSlideOver } from "./AdminOrganizationSlideOver";

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await httpRequest<any>("/organizations");
      const list = res?.data?.items ?? [];
      setOrgs(list);
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load organizations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrgs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this organization?")) return;
    try {
      await httpRequest(`/organizations/${id}`, { method: "DELETE" });
      showToast({ tone: "success", title: "Success", message: "Organization deleted successfully." });
      void fetchOrgs();
    } catch (err) {
      showToast({ tone: "danger", title: "Delete failed", message: "Failed to delete organization." });
    }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Admin";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="Administration"
      user={{ name: userName, role: "Admin" }}
      mobileNav={buildAppMobileNav()}
    >
      <div className="space-y-6">
        <PageHeader
          title="Organizations"
          description="Register and manage all corporate entities, ventures, and shared functions."
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Icon name="add" className="mr-1" /> Add Organization
            </Button>
          }
        />

        <SectionCard>
          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading organizations...</div>
          ) : orgs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-semibold text-slate-900">{org.name}</TableCell>
                      <TableCell className="text-slate-500">{org.code}</TableCell>
                      <TableCell className="text-slate-600 capitalize">
                        {String(org.organizationType ?? "venture").replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Chip variant={org.isActive ? "success" : "danger"}>
                          {org.isActive ? "Active" : "Inactive"}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingOrg(org)}
                          >
                            <Icon name="edit" className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger/5"
                            onClick={() => handleDelete(org.id)}
                          >
                            <Icon name="delete" className="mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">No organizations found.</div>
          )}
        </SectionCard>
      </div>

      {(showCreate || editingOrg) && (
        <AdminOrganizationSlideOver
          org={editingOrg}
          onClose={() => {
            setShowCreate(false);
            setEditingOrg(null);
          }}
          onSaved={() => {
            setShowCreate(false);
            setEditingOrg(null);
            void fetchOrgs();
          }}
        />
      )}
    </AppShell>
  );
}
