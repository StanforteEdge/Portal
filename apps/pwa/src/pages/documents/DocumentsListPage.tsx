import { useState } from "react";
import { AppShell, Button, Icon, PageHeader, SectionCard, useToast, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery, documentApi } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useNavigate } from "react-router-dom";
import DocumentSlideOver from "./DocumentSlideOver";

export default function DocumentsListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingDoc, setEditingDoc] = useState<any | boolean>(false);

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" }
  );

  const { data, loading, refetch } = useCachedQuery(
    `documents:list:${activeCategory}:${search}`,
    () => documentApi.list({
      category: activeCategory !== "all" ? activeCategory : undefined,
      search: search.trim() || undefined
    }),
    { ttlMs: 1000 * 10 }
  );

  const documents = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff Member";
  const userRole = profile?.employee_profile?.job_title || "Staff Member";

  const categories = [
    { id: "all", label: "All Documents" },
    { id: "policy", label: "Policies" },
    { id: "wiki", label: "Wikis & Guides" },
    { id: "handbook", label: "Handbooks" },
    { id: "general", label: "General" }
  ];

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="documents"
      user={{ name: userName, role: userRole }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Documents" }]}
        title="Documents Hub"
        description="Browse company policies, wikis, team guidebooks, and documentation templates."
        actions={
          <Button onClick={() => setEditingDoc(true)} className="gap-1">
            <Icon name="add" />
            Create Document
          </Button>
        }
      />

      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <Icon name="search" className="absolute left-3 top-2 text-slate-400 text-sm" />
          </div>
        </div>

        <SectionCard title="Directory">
          {loading && documents.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">Loading documents directory...</div>
          ) : documents.length === 0 ? (
            <div className="text-sm text-slate-500 py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              No documents found matching your filter rules.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Document Title</TableHeaderCell>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell>Version</TableHeaderCell>
                    <TableHeaderCell>Acknowledgement Required</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="hover:underline text-left text-primary font-semibold"
                        >
                          {doc.title}
                        </button>
                      </TableCell>
                      <TableCell className="capitalize text-xs font-medium text-slate-600">
                        {doc.category === "job_description" ? "Job Description" : doc.category}
                      </TableCell>
                      <TableCell>v{doc.version || "1.0"}</TableCell>
                      <TableCell>
                        {doc.require_acknowledgement ? (
                          <span className="text-amber-600 text-xs font-semibold flex items-center gap-1">
                            <Icon name="warning" className="text-sm" /> Required
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>

      {editingDoc !== false && (
        <DocumentSlideOver
          documentRecord={typeof editingDoc === "object" ? editingDoc : null}
          onClose={() => setEditingDoc(false)}
          onSaved={() => {
            setEditingDoc(false);
            void refetch();
          }}
        />
      )}
    </AppShell>
  );
}
