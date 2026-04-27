# Quick Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 frontend bugs: version banner persistence, dashboard username display, invisible mobile button text, redundant category column, attendance mode/status confusion, and files page upload/list failures.

**Architecture:** Pure frontend fixes — no backend changes. Each task is independent and can be deployed separately.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite.

---

## File Map

| File | Change |
|------|--------|
| `apps/pwa/src/shared/components/AppVersion.tsx` | Add sessionStorage reload flag, delay check after reload |
| `apps/shared/src/utils/display.ts` | Trim first_name/last_name in `userDisplayName` |
| `apps/pwa/src/pages/dashboard/DashboardPage.tsx` | Remove console.log, fix mobile button variant |
| `apps/pwa/src/pages/requests/RequestsListPage.tsx` | Remove Category column header and data cell |
| `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx` | Add `deriveAttendanceStatus`, fix `toneFromStatus`, remove mobile status duplicate |
| `apps/shared/src/api/resource-api.ts` | Remove Content-Type header from `uploadFile` |
| `apps/pwa/src/pages/files/FilesPage.tsx` | Fix listData extraction from paginated response, use `uploadFileAsset` |

---

## Task 1: Fix version banner persistence after reload

**Files:**
- Modify: `apps/pwa/src/shared/components/AppVersion.tsx`

- [ ] **Step 1: Update AppVersion component**

Replace the entire `AppVersion.tsx` with:

```typescript
import { useEffect, useState } from "react";
import { Button } from "@/shared";

type VersionManifest = {
  app_version: string;
  build_version: string;
  built_at: string;
};

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const RELOAD_FLAG = "se_version_reload";

export function AppVersion() {
  const builtAt = import.meta.env.VITE_APP_BUILT_AT as string | undefined;
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newBuildVersion, setNewBuildVersion] = useState<string | null>(null);

  async function checkVersion() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const payload = (await res.json()) as VersionManifest;
      if (payload.built_at && payload.built_at !== builtAt) {
        setNewBuildVersion(payload.build_version ?? null);
        setUpdateAvailable(true);
      }
    } catch {
      // ignore — version check failures are non-critical
    }
  }

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const justReloaded = sessionStorage.getItem(RELOAD_FLAG);
    if (justReloaded) {
      sessionStorage.removeItem(RELOAD_FLAG);
      // Delay the first check to give the new bundle time to load
      const timer = window.setTimeout(() => void checkVersion(), 10_000);
      const interval = window.setInterval(() => void checkVersion(), POLL_INTERVAL_MS);
      return () => {
        window.clearTimeout(timer);
        window.clearInterval(interval);
      };
    }

    void checkVersion();
    const timer = window.setInterval(() => void checkVersion(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[1100] w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">New version available</p>
      {newBuildVersion && (
        <p className="mt-0.5 text-xs text-slate-500">
          Build {newBuildVersion} is ready
        </p>
      )}
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => {
          sessionStorage.setItem(RELOAD_FLAG, newBuildVersion ?? "pending");
          window.location.reload();
        }}
      >
        Reload now
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "AppVersion" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/components/AppVersion.tsx && git commit -m "fix(pwa): suppress version banner after user-initiated reload"
```

---

## Task 2: Fix dashboard showing username instead of first/full name

**Files:**
- Modify: `apps/shared/src/utils/display.ts`
- Modify: `apps/pwa/src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Fix `userDisplayName` in display.ts**

In `apps/shared/src/utils/display.ts`, find (lines 63-66):

```typescript
export function userDisplayName(user?: Pick<AuthUser, "first_name" | "last_name" | "username" | "email"> | null, fallback = "Staff User") {
  const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();
  return name || user?.username || user?.email || fallback;
}
```

Replace with:

```typescript
export function userDisplayName(user?: Pick<AuthUser, "first_name" | "last_name" | "username" | "email"> | null, fallback = "Staff User") {
  const firstName = user?.first_name?.trim();
  const lastName = user?.last_name?.trim();
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || user?.username || user?.email || fallback;
}
```

- [ ] **Step 2: Remove console.log in DashboardPage.tsx**

In `apps/pwa/src/pages/dashboard/DashboardPage.tsx`, find (line 187):

```typescript
  console.log(dashboardUserName);
```

Delete this line.

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "display.ts\|DashboardPage" | head -10
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/shared/src/utils/display.ts apps/pwa/src/pages/dashboard/DashboardPage.tsx && git commit -m "fix(pwa): show first/full name on dashboard, remove debug console.log"
```

---

## Task 3: Fix invisible Open Attendance button on mobile

**Files:**
- Modify: `apps/pwa/src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Fix mobile button variant and classes**

In `apps/pwa/src/pages/dashboard/DashboardPage.tsx`, find (around line 621):

```typescript
            <Button className="bg-white text-brand-900 hover:bg-slate-100">
              Open Attendance
            </Button>
```

Replace with:

```typescript
            <Button
              variant="secondary"
              className="!border-white/10 !bg-white !text-brand-900 hover:!bg-slate-100"
            >
              Open Attendance
            </Button>
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "DashboardPage" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/dashboard/DashboardPage.tsx && git commit -m "fix(pwa): use variant=secondary with !important overrides for mobile attendance button"
```

---

## Task 4: Remove Category column from Requests list

**Files:**
- Modify: `apps/pwa/src/pages/requests/RequestsListPage.tsx`

- [ ] **Step 1: Remove familyLabel from UiRequestRow type and toRow function**

In `apps/pwa/src/pages/requests/RequestsListPage.tsx`, find the `UiRequestRow` type and remove the `familyLabel` field:

```typescript
  familyLabel: string;
```

Then in the `toRow` function, find and remove:

```typescript
    familyLabel: familyLabel(family),
```

- [ ] **Step 2: Remove Category table header cell**

Find and remove:

```typescript
              <TableHeaderCell>Category</TableHeaderCell>
```

- [ ] **Step 3: Remove Category table data cell**

Find and remove the Category data cell (3 lines):

```typescript
                <TableCell className="text-sm text-slate-600">
                  {row.familyLabel}
                </TableCell>
```

- [ ] **Step 4: Check if `familyLabel` function is still used elsewhere**

Search for any remaining uses of `familyLabel` in the file. If the `familyLabel` function (lines 123-127) and the `classifyFamily` function are no longer referenced, remove them too. If `classifyFamily` is still used (for filtering tabs), keep it but remove `familyLabel`.

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "RequestsListPage" | head -10
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/requests/RequestsListPage.tsx && git commit -m "fix(pwa): remove redundant Category column from Requests list"
```

---

## Task 5: Fix attendance Mode/Status columns

**Files:**
- Modify: `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx`

- [ ] **Step 1: Add `deriveAttendanceStatus` helper and update `toneFromStatus`**

Find the `toneFromStatus` function (lines 95-109):

```typescript
function toneFromStatus(
  status?: string | null,
): "success" | "warning" | "danger" | "pending" | "neutral" {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  if (["present", "approved", "resolved", "corrected"].includes(key))
    return "success";
  if (["late", "pending", "submitted", "review"].includes(key))
    return "warning";
  if (["absent", "rejected", "outside"].includes(key)) return "danger";
  if (["remote", "field", "holiday", "off_day", "leave"].includes(key))
    return "pending";
  return "neutral";
}
```

Replace with:

```typescript
function toneFromStatus(
  status?: string | null,
): "success" | "warning" | "danger" | "pending" | "neutral" {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  if (["present", "approved", "resolved", "corrected"].includes(key))
    return "success";
  if (["late", "pending", "submitted", "review"].includes(key))
    return "warning";
  if (["absent", "rejected", "outside"].includes(key)) return "danger";
  if (["remote", "field"].includes(key)) return "success";
  if (["holiday", "off_day", "leave"].includes(key)) return "neutral";
  return "neutral";
}

function deriveAttendanceStatus(row: AttendanceDaily): string {
  const status = String(row.status || "").trim().toLowerCase();
  if (["remote", "field", "onsite"].includes(status)) {
    return row.first_in_at ? "present" : "absent";
  }
  return status || (row.first_in_at ? "present" : "not_started");
}
```

Note: `AttendanceDaily` is the type used for each row in the attendance data — check the existing type/import and use it directly. If the type name is different, adjust accordingly.

- [ ] **Step 2: Update desktop Status cell to use `deriveAttendanceStatus`**

Find the Status cell (lines 747-757):

```typescript
                        <TableCell className="rounded-r-2xl">
                          <Chip
                            variant={
                              toneFromStatus(row.status) === "neutral"
                                ? "neutral"
                                : toneFromStatus(row.status)
                            }
                          >
                            {humanize(row.status)}
                          </Chip>
                        </TableCell>
```

Replace with:

```typescript
                        <TableCell className="rounded-r-2xl">
                          <Chip
                            variant={
                              toneFromStatus(deriveAttendanceStatus(row)) === "neutral"
                                ? "neutral"
                                : toneFromStatus(deriveAttendanceStatus(row))
                            }
                          >
                            {humanize(deriveAttendanceStatus(row))}
                          </Chip>
                        </TableCell>
```

- [ ] **Step 3: Fix mobile status display — remove duplicate**

Find the mobile status display (lines 1276-1289):

```typescript
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {humanize(row.status)}
                      </p>
                      <Chip
                        variant={
                          toneFromStatus(row.status) === "neutral"
                            ? "neutral"
                            : toneFromStatus(row.status)
                        }
                      >
                        {humanize(row.status)}
                      </Chip>
                    </div>
```

Replace with:

```typescript
                    <div className="flex items-center gap-2">
                      <Chip
                        variant={
                          toneFromStatus(deriveAttendanceStatus(row)) === "neutral"
                            ? "neutral"
                            : toneFromStatus(deriveAttendanceStatus(row))
                        }
                      >
                        {humanize(deriveAttendanceStatus(row))}
                      </Chip>
                    </div>
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "AttendancePage" | head -10
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/hr/attendance/AttendancePage.tsx && git commit -m "fix(pwa): derive attendance status from mode+clock-in, remove mobile status duplicate"
```

---

## Task 6: Fix files page upload and list rendering

**Files:**
- Modify: `apps/shared/src/api/resource-api.ts`
- Modify: `apps/pwa/src/pages/files/FilesPage.tsx`

- [ ] **Step 1: Remove Content-Type header from `uploadFile` in resource-api.ts**

In `apps/shared/src/api/resource-api.ts`, find the `uploadFile` method (lines 352-371). The key line to remove is:

```typescript
        headers: { "Content-Type": "multipart/form-data" },
```

The resulting `uploadFile` should be:

```typescript
    async uploadFile(file: File, options?: { organization_id?: string; metadata?: Record<string, unknown> }) {
      const form = new FormData();
      form.append("file", file);
      if (options?.organization_id) form.append("organization_id", options.organization_id);
      if (options?.metadata) form.append("metadata_json", JSON.stringify(options.metadata));
      const response = await httpRequest<any>("/files/upload", {
        method: "POST",
        body: form,
      });
      const row = response?.data ?? response;
      return {
        id: String(row.id),
        file_name: String(row.file_name ?? row.fileName ?? file.name),
        mime_type: row.mime_type ?? row.mimeType ?? file.type ?? null,
        file_size: row.file_size ?? row.fileSize ?? file.size,
        storage_path: String(row.storage_path ?? row.storagePath ?? ""),
        public_url: row.public_url ?? row.publicUrl ?? null,
      };
    },
```

- [ ] **Step 2: Fix FilesPage.tsx — use `listFileAssets` and `uploadFileAsset` from local files-api, fix list extraction**

In `apps/pwa/src/pages/files/FilesPage.tsx`:

**Add import** — at the top, add:

```typescript
import { listFileAssets, uploadFileAsset } from "./files-api";
```

**Remove import** — remove the `resourceApi` import (line 18):

```typescript
import { resourceApi } from "@/shared/lib/core";
```

(Check if `resourceApi` is still used elsewhere in the file. If not, remove the import.)

**Replace the query** (lines 44-57) — change from `resourceApi.listFiles` to `listFileAssets` and extract the result array properly:

```typescript
  const { data: files, loading, refetch } = useCachedQuery(
    `user:files:${listKey}:${search}:${fileType}:${page}:${perPage}`,
    async () => {
      const result = await listFileAssets({
        search: search || undefined,
        file_type: (fileType as "images" | "videos" | "documents") || undefined,
        include_usage: true,
        page,
        per_page: perPage,
      });
      return result;
    },
    { ttlMs: 0, storage: "memory" },
  );
```

Note: `listFileAssets` already returns an array of `FileAssetRecord` objects, so no need for `Array.isArray` checks.

**Remove stale line** — remove `setTotalCount(Array.isArray(result) ? result.length : 0);` from the query callback (it was on line 53). Also remove the `totalCount` state setter approach — we'll compute it from the response. But actually, `listFileAssets` doesn't return pagination metadata. Change approach: keep `totalCount` state but set it based on the length of the returned array as a fallback for now.

Actually, looking more carefully: `listFileAssets` returns an array directly. We need total count for pagination. The simplest fix: add `uploaded_by` and remove `page`/`per_page` since `listFileAssets` doesn't support pagination well. But actually it does — it accepts `page` and `per_page` params.

Let me simplify: keep `resourceApi.listFiles` for the data (since it returns pagination metadata), but fix the extraction. Or switch to `listFileAssets` and handle pagination differently.

**Simplest correct fix**: Keep using `resourceApi.listFiles` but extract `result` properly:

Replace the query block (lines 44-59) with:

```typescript
  const { data: filesResult, loading, refetch } = useCachedQuery(
    `user:files:${listKey}:${search}:${fileType}:${page}:${perPage}`,
    async () => {
      const result = await resourceApi.listFiles({
        search: search || undefined,
        file_type: (fileType as "images" | "videos" | "documents") || undefined,
        page,
        per_page: perPage,
      });
      setTotalCount(result.total ?? result.total_result ?? 0);
      return result;
    },
    { ttlMs: 0, storage: "memory" },
  );

  const files = filesResult?.result ?? [];
```

And change the upload call (line 73) to use `uploadFileAsset`:

```typescript
      await uploadFileAsset(file, { metadata: { source: "staff_files" } });
```

Also add the import:

```typescript
import { uploadFileAsset } from "./files-api";
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "FilesPage\|resource-api" | head -10
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/shared/src/api/resource-api.ts apps/pwa/src/pages/files/FilesPage.tsx && git commit -m "fix(pwa): fix files upload multipart boundary and list rendering from paginated response"
```

---

## Manual Verification

After all tasks:

- [ ] Navigate to Dashboard → confirm greeting shows "Olalekan" or "Olalekan Owonikoko" instead of "olalekan.owonikoko"
- [ ] On mobile viewport → confirm "Open Attendance" button text is visible (dark on white)
- [ ] Navigate to Requests list → confirm Category column is gone
- [ ] Navigate to Attendance → confirm Status column shows "Present"/"Late"/"Absent" (not "Remote")
- [ ] Navigate to Files → confirm list loads and upload works without boundary error
- [ ] Trigger version banner (temporarily change `VITE_APP_BUILT_AT`) → click "Reload now" → confirm banner does not reappear immediately