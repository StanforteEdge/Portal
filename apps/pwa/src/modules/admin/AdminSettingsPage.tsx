import { useState, useEffect } from "react";
import {
  AppShell,
  PageHeader,
  Button,
  Chip,
  Icon,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  SelectField,
  useToast,
} from "@/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useAuth } from "@/shared/context/AuthProvider";
import { requestApi } from "@/shared/lib/core";
import { type RequestType } from "@stanforte/shared";
import RequestTypeSlideOver from "./RequestTypeSlideOver";

type ActiveTab = "request-types" | "general" | "security";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("request-types");
  const [editingType, setEditingType] = useState<RequestType | null | boolean>(false);
  const [listKey, setListKey] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await requestApi.listTypes();
      setTypes(res);
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load request types." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDeleteType = async (type: RequestType) => {
    if (!window.confirm(`Delete request type "${type.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await requestApi.deleteType(type.id);
      showToast({ tone: "success", title: "Deleted", message: `${type.name} has been removed.` });
      void load();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unable to delete type.",
      });
    }
  };

  const navItems = [
    { id: "request-types" as ActiveTab, label: "Request Types", icon: "assignment" },
    { id: "general" as ActiveTab, label: "General Settings", icon: "tune" },
    { id: "security" as ActiveTab, label: "Security & Access", icon: "security" },
  ];

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Admin";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-settings"
      user={{
        name: userName,
        role: "System Administrator",
      }}
      mobileNav={buildAppMobileNav()}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration", path: "/admin/users" }, { label: "System Settings" }]}
        title="System Settings"
        description="Manage global system configurations and business rules."
      />

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {navItems.find((i) => i.id === activeTab)?.label || "Settings"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTab === "request-types" && "Global list of all request categories and their workflows."}
                  {activeTab === "general" && "General system configurations."}
                  {activeTab === "security" && "Security and access control settings."}
                </p>
              </div>
              {activeTab === "request-types" && (
                <Button onClick={() => setEditingType(true)}>
                  <Icon name="add" className="mr-1" />
                  Add Type
                </Button>
              )}
            </div>

            {activeTab === "request-types" && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Loading request types...</div>
                ) : types.length > 0 ? (
                  <Table>
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Slug/Prefix</TableHeaderCell>
                        <TableHeaderCell>Category</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {types.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-bold text-slate-900">{t.name}</TableCell>
                          <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                          <TableCell className="capitalize">{t.category || "General"}</TableCell>
                          <TableCell>
                            <Chip variant={t.is_active ? "success" : "neutral"}>
                              {t.is_active ? "Active" : "Disabled"}
                            </Chip>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingType(t)}
                              >
                                <Icon name="edit" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger hover:bg-danger/5"
                                onClick={() => void handleDeleteType(t)}
                              >
                                <Icon name="delete" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    No request types found.
                  </div>
                )}
              </div>
            )}

            {activeTab === "general" && (
              <div className="py-10 text-center text-slate-400">
                General system settings coming soon.
              </div>
            )}

            {activeTab === "security" && (
              <div className="py-10 text-center text-slate-400">
                Security and access control settings coming soon.
              </div>
            )}
          </SectionCard>
        </main>
      </div>

      {editingType !== false && (
        <RequestTypeSlideOver
          requestType={typeof editingType === "object" ? editingType : null}
          onClose={() => setEditingType(false)}
          onSaved={() => {
            setEditingType(false);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}
