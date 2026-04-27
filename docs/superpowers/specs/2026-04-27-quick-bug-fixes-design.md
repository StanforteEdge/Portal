# Quick Bug Fixes — 2026-04-27 Issues (Phase 1)

**Date:** 2026-04-27
**Status:** Approved

## Goal

Fix 6 frontend bugs reported in the issues document, all pure frontend fixes with no backend changes needed.

## Bugs

### Bug 1: Version banner persists after reload

**File:** `apps/pwa/src/shared/components/AppVersion.tsx`

**Problem:** After clicking "Reload now", `window.location.reload()` reloads the page but if the cached bundle still has the old `builtAt` timestamp, `checkVersion()` immediately detects the same difference and shows the banner again. No mechanism suppresses re-detection after a user-initiated reload.

**Fix:** Before reloading, set a `sessionStorage` flag. On mount, if the flag is present, clear it and delay the next version check by 10 seconds (giving the new bundle time to load).

### Bug 2: Dashboard shows username instead of first/full name

**Files:** `apps/shared/src/utils/display.ts` (lines 63-66), `apps/pwa/src/pages/dashboard/DashboardPage.tsx` (line 187, 202, 581)

**Problem:** `userDisplayName()` merges `first_name` + `last_name` and falls through to `username` when the combined name is falsy. Empty strings (`""`) are not caught by `??` (which only handles `null`/`undefined`), so users with empty-string names get `olalekan.owonikoko` displayed.

**Fix:**
1. In `userDisplayName`, trim `first_name` and `last_name` before combining — empty/whitespace strings become falsy and fall through correctly.
2. Remove debug `console.log` on line 187 of `DashboardPage.tsx`.

### Bug 3: Open Attendance button invisible text on mobile

**File:** `apps/pwa/src/pages/dashboard/DashboardPage.tsx` (line ~621)

**Problem:** The mobile "Open Attendance" button uses default `variant="primary"` (which adds `text-white`) alongside a `className` with `text-brand-900`. Tailwind utility conflicts cause white-on-white text.

**Fix:** Change the mobile button to use `variant="secondary"` with the same important-override classes as the desktop version: `!border-white/10 !bg-white !text-brand-900 hover:!bg-slate-100`.

### Bug 4: Remove Category column from Requests list

**File:** `apps/pwa/src/pages/requests/RequestsListPage.tsx`

**Problem:** The "Category" column shows "Financial" or "Leave" — redundant with the family filter tabs already present.

**Fix:** Remove the `<TableHeaderCell>Category</TableHeaderCell>` and its corresponding `<TableCell>` data cell from both desktop and mobile table views. Also remove the `familyLabel` field from the row type and `toRow` function.

### Bug 5: Attendance Mode/Status columns showing wrong data

**File:** `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx`

**Problem:** The `toneFromStatus` function maps mode values (`remote`, `field`) as if they were statuses, and the Status column displays `row.status` raw — which can be a mode value like "remote" instead of "present" or "late".

**Fix:**
1. Add a `deriveAttendanceStatus` helper that maps mode values (`remote`, `field`, `onsite`) to proper statuses: if the person has a clock-in time, they're "present"; otherwise "absent".
2. In `toneFromStatus`, treat `remote`/`field` as `success` tone (they attended, just remotely).
3. Use `deriveAttendanceStatus(row)` for the Status column display text and `toneFromStatus(deriveAttendanceStatus(row))` for the chip color.
4. Remove duplicate status display in the mobile view (showing `row.status` twice — once as plain text, once as chip).

### Bug 6: Files page — upload error & list not rendering

**Files:** `apps/shared/src/api/resource-api.ts` (line 360), `apps/pwa/src/pages/files/FilesPage.tsx` (lines 44-59, 73)

**Problem A:** `resourceApi.uploadFile` explicitly sets `Content-Type: multipart/form-data` without a boundary, preventing the browser from generating the proper boundary header, causing a 400 error.

**Problem B:** `resourceApi.listFiles()` returns a structured object `{ result, total, ... }` but the code treats the response as an array. `Array.isArray(result)` fails, so `files` becomes `[]`.

**Fix:**
1. In `resource-api.ts`, remove the explicit `Content-Type` header from `uploadFile` — let the browser set it automatically with the boundary.
2. In `FilesPage.tsx`, extract `result` from the paginated response and use `total`/`total_result` for `setTotalCount`. Switch from `resourceApi.listFiles` to the local `listFileAssets` which already returns a simple array.

## Files Affected

| File | Change |
|------|--------|
| `apps/pwa/src/shared/components/AppVersion.tsx` | Add sessionStorage flag on reload, delay check after reload |
| `apps/shared/src/utils/display.ts` | Trim first_name/last_name in userDisplayName |
| `apps/pwa/src/pages/dashboard/DashboardPage.tsx` | Remove console.log, fix mobile button variant |
| `apps/pwa/src/pages/requests/RequestsListPage.tsx` | Remove Category column |
| `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx` | Add deriveAttendanceStatus, fix toneFromStatus, fix mobile duplicate |
| `apps/shared/src/api/resource-api.ts` | Remove Content-Type header from uploadFile |
| `apps/pwa/src/pages/files/FilesPage.tsx` | Fix listData extraction, switch to listFileAssets |