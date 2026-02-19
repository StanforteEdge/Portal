import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormCheck, FormInput } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Menu } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { deleteFileAsset, listFileAssets, uploadFileAsset, type FileAssetRecord } from "@/services/files";
import { useAppSelector } from "@/stores/hooks";

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function toPreviewUrl(file: FileAssetRecord) {
  if (file.public_url) return file.public_url;
  if (!file.storage_path) return null;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1").replace(/\/+$/, "");
  const root = apiBase.endsWith("/v1") ? apiBase.slice(0, -3) : apiBase;
  return `${root}/${file.storage_path.replace(/^\/+/, "")}`;
}

function getUploadMaxBytes() {
  const mb = Number(import.meta.env.VITE_UPLOAD_MAX_MB || 10);
  return Math.max(1, mb) * 1024 * 1024;
}

function getAllowedUploadMimeTypes() {
  const raw = String(import.meta.env.VITE_UPLOAD_ALLOWED_TYPES || "").trim();
  if (!raw) return null;
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function Main() {
  const auth = useAppSelector((state) => state.auth);
  const userId = auth.user?.id ? String(auth.user.id) : "";

  const [items, setItems] = useState<FileAssetRecord[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "images" | "videos" | "documents" | "attached" | "free">("all");
  const [checked, setChecked] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [statsBaseItems, setStatsBaseItems] = useState<FileAssetRecord[]>([]);

  const stats = useMemo(() => {
    const attached = statsBaseItems.filter((item) => item.usage?.attached).length;
    const images = statsBaseItems.filter((item) => String(item.mime_type || "").startsWith("image/")).length;
    const videos = statsBaseItems.filter((item) => String(item.mime_type || "").startsWith("video/")).length;
    const documents = statsBaseItems.filter((item) => {
      const mime = String(item.mime_type || "").toLowerCase();
      return mime.includes("pdf") || mime.includes("msword") || mime.includes("officedocument") || mime.startsWith("text/");
    }).length;
    return {
      total: statsBaseItems.length,
      attached,
      free: Math.max(0, statsBaseItems.length - attached),
      images,
      videos,
      documents,
    };
  }, [statsBaseItems]);

  const load = async (term?: string, filter?: typeof activeFilter) => {
    if (!userId) return;
    try {
      setBusy(true);
      const active = filter ?? activeFilter;
      const fileType = active === "images" || active === "videos" || active === "documents" ? active : undefined;
      const attached = active === "attached" ? true : active === "free" ? false : undefined;
      const [data, allData] = await Promise.all([
        listFileAssets({
          uploaded_by: userId,
          include_usage: true,
          per_page: 200,
          search: term?.trim() || undefined,
          file_type: fileType,
          attached,
        }),
        listFileAssets({
          uploaded_by: userId,
          include_usage: true,
          per_page: 500,
          search: term?.trim() || undefined,
        }),
      ]);
      setItems(data || []);
      setStatsBaseItems(allData || []);
      setChecked([]);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load your files." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (userId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId) void load(search, activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setBusy(true);
      const allowed = getAllowedUploadMimeTypes();
      const maxBytes = getUploadMaxBytes();
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (file.size > maxBytes) {
          setNotice({ tone: "warning", message: `${file.name} exceeds max upload size.` });
          return;
        }
        if (allowed && allowed.length > 0 && !allowed.includes(String(file.type || "").toLowerCase())) {
          setNotice({ tone: "warning", message: `${file.name} has unsupported file type.` });
          return;
        }
      }
      for (const file of fileList) {
        await uploadFileAsset(file, { metadata: { source: "media_library", scope: "self" } });
      }
      setNotice({ tone: "success", message: `${files.length} file(s) uploaded.` });
      await load(search, activeFilter);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setBusy(true);
      await deleteFileAsset(id);
      setNotice({ tone: "success", message: "File deleted." });
      await load(search, activeFilter);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Cannot delete this file." });
    } finally {
      setBusy(false);
    }
  };

  const toggleChecked = (id: string) => {
    setChecked((prev) => (prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]));
  };

  const deleteSelected = async () => {
    if (checked.length === 0) return;
    try {
      setBusy(true);
      let deleted = 0;
      let blocked = 0;
      for (const id of checked) {
        try {
          await deleteFileAsset(id);
          deleted += 1;
        } catch {
          blocked += 1;
        }
      }
      await load(search, activeFilter);
      setNotice({
        tone: blocked > 0 ? "warning" : "success",
        message: blocked > 0 ? `${deleted} deleted, ${blocked} blocked (attached).` : `${deleted} files deleted.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const filterButton = (key: typeof activeFilter, label: string, icon: string, count: number) => (
    <button
      className={`w-full flex items-center px-3 py-2 rounded-md ${activeFilter === key ? "bg-primary text-white" : ""}`}
      onClick={() => setActiveFilter(key)}
    >
      <Lucide icon={icon as any} className="w-4 h-4 mr-2" /> {label} ({count})
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-12 gap-6 mt-8">
        <div className="col-span-12 lg:col-span-3 2xl:col-span-2">
          <h2 className="mt-2 mr-auto text-lg font-medium intro-y">My Media</h2>

          <div className="p-5 mt-6 intro-y box">
            <div className="mt-1 space-y-2">
              {filterButton("all", "All Files", "Folder", stats.total)}
              {filterButton("images", "Images", "Image", stats.images)}
              {filterButton("videos", "Videos", "Video", stats.videos)}
              {filterButton("documents", "Documents", "FileText", stats.documents)}
              {filterButton("attached", "Attached", "Link", stats.attached)}
              {filterButton("free", "Unattached", "Unlink", stats.free)}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 2xl:col-span-10">
          <div className="flex flex-col-reverse items-center intro-y sm:flex-row">
            <div className="relative w-full mt-3 mr-auto sm:w-auto sm:mt-0">
              <Lucide
                icon="Search"
                className="absolute inset-y-0 left-0 z-10 w-4 h-4 my-auto ml-3 text-slate-500"
              />
              <FormInput
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-10 sm:w-64 !box"
                placeholder="Search files"
              />
              <Menu className="absolute inset-y-0 right-0 flex items-center mr-3">
                <Menu.Button as="a" role="button" className="block w-4 h-4" href="#">
                  <Lucide icon="ChevronDown" className="w-4 h-4 cursor-pointer text-slate-500" />
                </Menu.Button>
                <Menu.Items placement="bottom-start" className="pt-2 w-48 -mt-0.5">
                  <Menu.Item onClick={() => setActiveFilter("all")}>All files</Menu.Item>
                  <Menu.Item onClick={() => setActiveFilter("images")}>Images</Menu.Item>
                  <Menu.Item onClick={() => setActiveFilter("videos")}>Videos</Menu.Item>
                  <Menu.Item onClick={() => setActiveFilter("documents")}>Documents</Menu.Item>
                  <Menu.Item onClick={() => setActiveFilter("attached")}>Attached</Menu.Item>
                  <Menu.Item onClick={() => setActiveFilter("free")}>Unattached</Menu.Item>
                </Menu.Items>
              </Menu>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <Button variant="outline-secondary" onClick={() => void load(search, activeFilter)} disabled={busy}>
                Find
              </Button>
              <Button variant="primary" className="shadow-md" onClick={() => uploadInputRef.current?.click()} disabled={busy}>
                Upload New Files
              </Button>
              <Button variant="outline-danger" onClick={() => void deleteSelected()} disabled={busy || checked.length === 0}>
                Delete Selected
              </Button>
              <FormInput
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onUpload(e.target.files);
                  e.target.value = "";
                }}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 mt-5 intro-y sm:gap-6">
            {items.map((item) => (
              <div key={item.id} className="col-span-6 intro-y sm:col-span-4 md:col-span-3 2xl:col-span-2">
                <div className="relative px-3 pt-8 pb-5 rounded-md file box sm:px-5 zoom-in">
                  <div className="absolute top-0 left-0 mt-3 ml-3">
                    <FormCheck.Input
                      className="border"
                      type="checkbox"
                      checked={checked.includes(item.id)}
                      onChange={() => toggleChecked(item.id)}
                    />
                  </div>

                  <div className="w-3/5 mx-auto text-center">
                    <Lucide icon="File" className="w-12 h-12 mx-auto text-slate-400" />
                  </div>

                  <a
                    href="#"
                    className="block mt-4 font-medium text-center truncate"
                    onClick={(e: { preventDefault: () => void }) => e.preventDefault()}
                  >
                    {item.file_name}
                  </a>
                  <div className="text-xs text-slate-500 text-center mt-0.5">{formatBytes(item.file_size)}</div>
                  <div className="text-xs text-slate-500 text-center mt-0.5 truncate">{item.mime_type || "-"}</div>
                  <div className={clsx("text-xs text-center mt-1", item.usage?.attached ? "text-warning" : "text-success")}>
                    {item.usage?.attached ? "Attached" : "Not attached"}
                  </div>

                  <div className="absolute top-0 right-0 mr-2 mt-2 ml-auto">
                    <Menu>
                      <Menu.Button
                        as="a"
                        className="block w-5 h-5"
                        href="#"
                        onClick={(e: { preventDefault: () => void }) => e.preventDefault()}
                      >
                        <Lucide icon="MoreVertical" className="w-5 h-5 text-slate-500" />
                      </Menu.Button>
                      <Menu.Items className="w-40">
                        {toPreviewUrl(item) ? (
                          <Menu.Item>
                            <a href={toPreviewUrl(item)!} target="_blank" rel="noreferrer" className="flex items-center">
                              <Lucide icon="Eye" className="w-4 h-4 mr-2" /> Preview
                            </a>
                          </Menu.Item>
                        ) : null}
                        <Menu.Item>
                          <button
                            className="flex items-center w-full"
                            onClick={() => void onDelete(item.id)}
                            disabled={busy || Boolean(item.usage?.attached)}
                          >
                            <Lucide icon="Trash" className="w-4 h-4 mr-2" /> Delete
                          </button>
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                  </div>
                </div>
              </div>
            ))}

            {!busy && items.length === 0 ? (
              <div className="col-span-12 box p-5 text-slate-500">No files found for this view.</div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center mt-6 intro-y sm:flex-row sm:flex-nowrap">
            <Pagination className="w-full sm:w-auto sm:mr-auto">
              <Pagination.Link>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link>
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>1</Pagination.Link>
              <Pagination.Link>2</Pagination.Link>
              <Pagination.Link>
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link>
                <Lucide icon="ChevronsRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
            <div className="mx-auto text-slate-500 mt-3 sm:mt-0">
              Showing {items.length} of {stats.total} files
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
