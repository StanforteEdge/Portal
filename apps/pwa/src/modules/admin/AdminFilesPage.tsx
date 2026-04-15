import { useState, useRef } from "react";
import {
  Button,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  SelectField,
  PaginationControls,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { resourceApi } from "@/shared/lib/core";
import { formatFileSize } from "@/shared/lib/formatting";

type ViewMode = "grid" | "list";

export default function AdminFilesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [listKey, setListKey] = useState(0);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: filesData, loading, refetch } = useCachedQuery(
    `admin:files:${listKey}:${search}:${fileType}:${page}:${perPage}`,
    async () => {
      const result = await resourceApi.listFiles({
        search: search || undefined,
        include_usage: true,
        file_type: (fileType as "images" | "videos" | "documents") || undefined,
        page,
        per_page: perPage,
      });
      setTotalCount(Array.isArray(result) ? result.length : 0);
      return result;
    },
    { ttlMs: 0, storage: "memory" },
  );

  const files = Array.isArray(filesData) ? filesData : [];
  const totalPages = Math.ceil(totalCount / perPage) || 1;
  const attachedCount = files.filter((f) => f.usage?.attached).length;

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await resourceApi.uploadFile(file, { metadata: { source: "media_library" } });
      showToast({ tone: "success", title: "Upload complete", message: `${file.name} uploaded successfully.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Upload failed", message: err instanceof Error ? err.message : "Unable to upload file." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    setDeletingId(fileId);
    try {
      await resourceApi.deleteFile(fileId);
      showToast({ tone: "success", title: "File deleted", message: `${fileName} deleted.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Delete failed", message: err instanceof Error ? err.message : "Unable to delete file." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-files"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Administration", path: "/admin/users" },
          { label: "Files" },
        ]}
        title="Media Library"
        description="Manage uploaded files and media assets."
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Files" value={String(files.length)} tone="neutral" />
          <StatCard label="Attached" value={String(attachedCount)} tone="success" />
          <StatCard label="Unused" value={String(files.length - attachedCount)} tone="neutral" />
          <StatCard label="Showing" value={`${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalCount)}`} tone="neutral" />
        </div>

        {/* Filters & Upload */}
        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm flex-1 min-w-[180px]">
              <span className="font-semibold text-slate-700">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by file name..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              />
            </label>

            <SelectField
              label="File Type"
              value={fileType}
              onChange={(e) => { setFileType(e.target.value); setPage(1); }}
              className="min-w-[140px]"
            >
              <option value="">All Types</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="documents">Documents</option>
            </SelectField>

            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              <Icon name="refresh" className="text-[16px]" />
              Refresh
            </Button>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Upload</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                disabled={uploading}
                className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-xl file:border-0 file:bg-brand-900 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800 disabled:opacity-50"
              />
            </label>
          </div>
          {uploading && (
            <p className="text-sm text-brand-600 mt-2">Uploading...</p>
          )}
        </section>

        {/* Files Display */}
        <SectionCard
          title="All Files"
          description={`${totalCount} file${totalCount !== 1 ? "s" : ""}`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Icon name="grid_view" className="text-[16px]" />
              </Button>
              <Button
                variant={viewMode === "list" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <Icon name="view_list" className="text-[16px]" />
              </Button>
            </div>
          }
        >
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-10">
              <Icon name="folder_open" className="text-4xl text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No files found.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {file.mime_type?.startsWith("image/") ? (
                      file.public_url ? (
                        <img src={file.public_url} alt={file.file_name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="image" className="text-3xl text-slate-400" />
                      )
                    ) : file.mime_type?.startsWith("video/") ? (
                      <Icon name="videocam" className="text-3xl text-slate-400" />
                    ) : (
                      <Icon name="description" className="text-3xl text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700 truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.file_size)}</p>
                  {file.usage?.attached ? (
                    <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
                      Attached
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => void handleDelete(file.id, file.file_name)}
                      disabled={deletingId === file.id}
                    >
                      <Icon name="delete" className="text-sm" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-600">Name</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Type</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Size</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Usage</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.file_name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{file.storage_path}</p>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {file.mime_type || "-"}
                        </code>
                      </td>
                      <td className="p-3 text-slate-600">{formatFileSize(file.file_size)}</td>
                      <td className="p-3">
                        {file.usage?.attached ? (
                          <span className="text-xs text-green-600">
                            Attached ({file.usage.request_items} req, {file.usage.pv_evidence} PV, {file.usage.retirement_refs} ret)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not attached</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(file.id, file.file_name)}
                          disabled={deletingId === file.id || Boolean(file.usage?.attached)}
                        >
                          {deletingId === file.id ? "..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            perPage={perPage}
            onPerPageChange={setPerPage}
            onPageChange={setPage}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
