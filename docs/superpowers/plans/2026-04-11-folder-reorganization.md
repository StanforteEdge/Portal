# Folder Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `apps/pwa/src/` from a split api/features layout into a module-first structure where each business domain owns its API and pages co-located.

**Architecture:** `modules/` for domain-owned views (Finance, HR), `features/` for cross-cutting capabilities (Requests workflow engine, Files, Taxonomy), `shared/` for infrastructure (components, context, lib, workspace-api), `pages/` for app-level screens (auth, dashboard, system). Requests is a *feature* not a module — it's a shared workflow engine that Finance (financial), HR (leave), and Admin (other) all plug into with their own filtered views.

**Tech Stack:** React, TypeScript, Vite (`@/` alias → `src/`). The `@/` alias must remain unchanged throughout.

---

## Domain Model Rationale

```
RequestRecord (shared type)
  family: "financial" | "leave" | "other"
       │                  │           │
       ▼                  ▼           ▼
  modules/finance/   modules/hr/   modules/admin/ (future)
  (finance admin      (leave mgmt)  (other requests)
   views)

Staff submits & tracks ALL families via features/requests/
```

`requests-api.ts`, `requests-data.ts`, `request-helpers.ts` live in `features/requests/` because they are shared across both staff pages AND module admin pages.

---

## Target Structure

```
src/
├── modules/
│   ├── finance/
│   │   ├── finance-api.ts              ← was api/finance/finance-api.ts
│   │   ├── FinanceDashboardPage.tsx    ← was features/finance/requests/
│   │   ├── FinancePaymentVouchersPage.tsx
│   │   ├── FinanceRequestDetailsPage.tsx
│   │   └── FinanceRequestsPage.tsx
│   └── hr/
│       ├── attendance-api.ts           ← was api/attendance/attendance-api.ts
│       ├── attendance-data.ts          ← was api/attendance/attendance-data.ts
│       └── AttendancePage.tsx          ← was features/attendance/AttendancePage.tsx
├── features/
│   ├── requests/                       ← shared workflow engine (staff + shared types)
│   │   ├── requests-api.ts             ← was api/requests/requests-api.ts
│   │   ├── requests-data.ts            ← was lib/requests/requests-data.ts
│   │   ├── request-helpers.ts          ← was lib/requests/request-helpers.ts
│   │   ├── RequestDetailsPage.tsx      ← stays (was features/requests/)
│   │   ├── RequestsListPage.tsx        ← stays
│   │   └── new/
│   │       ├── FinancialRequestFormPage.tsx  ← stays
│   │       ├── RequestFormPage.tsx
│   │       └── RequestTypePage.tsx
│   ├── files/
│   │   └── files-api.ts                ← was api/files/files-api.ts
│   └── taxonomy/
│       ├── taxonomy-api.ts             ← was api/taxonomy-api.ts
│       └── TagPicker.tsx               ← was components/ui/TagPicker.tsx
├── shared/
│   ├── api/
│   │   └── workspace-api.ts            ← was features/system/workspace-api.ts
│   ├── components/
│   │   ├── auth/                       ← was components/auth/
│   │   ├── layout/                     ← was components/layout/
│   │   └── ui/                         ← was components/ui/ (minus TagPicker)
│   ├── context/
│   │   └── AuthProvider.tsx            ← was context/AuthProvider.tsx
│   └── lib/
│       ├── core.ts                     ← was lib/core.ts
│       ├── download.ts                 ← was lib/download.ts
│       └── env.ts                      ← was lib/env.ts
└── pages/
    ├── auth/                           ← was features/auth/
    ├── dashboard/
    │   └── DashboardPage.tsx           ← was features/dashboard/
    └── system/
        ├── HelpPage.tsx                ← was features/system/
        ├── NotificationsPage.tsx
        ├── ProfilePage.tsx
        ├── SettingsPage.tsx
        ├── index.ts
        └── page-helpers.tsx
        (workspace-api.ts moves to shared/api/)
```

---

## Import Path Mapping (Old → New)

| Old `@/...` | New `@/...` |
|---|---|
| `@/lib/core` | `@/shared/lib/core` |
| `@/lib/env` | `@/shared/lib/env` |
| `@/lib/download` | `@/shared/lib/download` |
| `@/lib/requests/requests-data` | `@/features/requests/requests-data` |
| `@/lib/requests/request-helpers` | `@/features/requests/request-helpers` |
| `@/context/AuthProvider` | `@/shared/context/AuthProvider` |
| `@/components/layout/AppShell` | `@/shared/components/layout/AppShell` |
| `@/components/auth/RouteGuards` | `@/shared/components/auth/RouteGuards` |
| `@/components/auth/AccessRoute` | `@/shared/components/auth/AccessRoute` |
| `@/components/ui/TagPicker` | `@/features/taxonomy/TagPicker` |
| `@/api/requests/requests-api` | `@/features/requests/requests-api` |
| `@/api/finance/finance-api` | `@/modules/finance/finance-api` |
| `@/api/attendance/attendance-api` | `@/modules/hr/attendance-api` |
| `@/api/files/files-api` | `@/features/files/files-api` |
| `@/api/taxonomy-api` | `@/features/taxonomy/taxonomy-api` |
| `@/features/system/workspace-api` | `@/shared/api/workspace-api` |
| `@/features/system` (barrel) | `@/pages/system` |
| `@/features/auth/...` | `@/pages/auth/...` |
| `@/features/dashboard/...` | `@/pages/dashboard/...` |
| `@/features/finance/requests/...` | `@/modules/finance/...` |
| `@/features/attendance/...` | `@/modules/hr/...` |

**Note:** `@/features/requests/...` stays the same path — only the internal api/lib files get pulled *into* that folder. Pages stay in place.

---

## Task 1: Move shared/lib

**Files:**
- Create: `src/shared/lib/env.ts`
- Create: `src/shared/lib/core.ts`
- Create: `src/shared/lib/download.ts`
- Delete: `src/lib/core.ts`, `src/lib/download.ts`, `src/lib/env.ts`

- [x] **Step 1: Create `src/shared/lib/env.ts`**

No internal imports — copy as-is:
```bash
mkdir -p apps/pwa/src/shared/lib
cp apps/pwa/src/lib/env.ts apps/pwa/src/shared/lib/env.ts
```

- [x] **Step 2: Create `src/shared/lib/core.ts`**

```bash
cp apps/pwa/src/lib/core.ts apps/pwa/src/shared/lib/core.ts
```

In `apps/pwa/src/shared/lib/core.ts`, update:
```ts
// Old:
import { API_BASE_URL, CACHE_PREFIX } from "@/lib/env";
// New:
import { API_BASE_URL, CACHE_PREFIX } from "@/shared/lib/env";
```

- [x] **Step 3: Create `src/shared/lib/download.ts`**

No internal imports — copy as-is:
```bash
cp apps/pwa/src/lib/download.ts apps/pwa/src/shared/lib/download.ts
```

- [x] **Step 4: Delete old lib root files** (keep `lib/requests/` — moves in Task 4)

```bash
rm apps/pwa/src/lib/core.ts
rm apps/pwa/src/lib/download.ts
rm apps/pwa/src/lib/env.ts
```

- [x] **Step 5: Spot-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "shared/lib" | head -10
```

Expected: no errors inside the new `shared/lib/` files themselves.

---

## Task 2: Move shared/context and shared/api

**Files:**
- Create: `src/shared/context/AuthProvider.tsx`
- Create: `src/shared/api/workspace-api.ts`
- Delete: `src/context/AuthProvider.tsx`, `src/features/system/workspace-api.ts`

- [x] **Step 1: Create `src/shared/context/AuthProvider.tsx`**

```bash
mkdir -p apps/pwa/src/shared/context
cp apps/pwa/src/context/AuthProvider.tsx apps/pwa/src/shared/context/AuthProvider.tsx
```

In `apps/pwa/src/shared/context/AuthProvider.tsx`, update:
```ts
// Old:
import { authApi, authSession } from "@/lib/core";
// New:
import { authApi, authSession } from "@/shared/lib/core";
```

- [x] **Step 2: Create `src/shared/api/workspace-api.ts`**

`workspace-api` is elevated to `shared/` because it's imported by layout components (`AppShell`, `TopBar`) AND by 6+ pages across modules. It cannot live in `pages/system/`.

```bash
mkdir -p apps/pwa/src/shared/api
cp apps/pwa/src/features/system/workspace-api.ts apps/pwa/src/shared/api/workspace-api.ts
```

In `apps/pwa/src/shared/api/workspace-api.ts`, update:
```ts
// Old:
import { httpRequest } from "@/lib/core";
// New:
import { httpRequest } from "@/shared/lib/core";
```

- [x] **Step 3: Delete old files**

```bash
rm apps/pwa/src/context/AuthProvider.tsx
rmdir apps/pwa/src/context
rm apps/pwa/src/features/system/workspace-api.ts
```

---

## Task 3: Move shared/components

**Files:**
- Create: `src/shared/components/auth/` (3 files)
- Create: `src/shared/components/layout/` (11 files)
- Create: `src/shared/components/ui/` (5 files, TagPicker excluded)
- Delete: `src/components/`

- [x] **Step 1: Copy auth components**

```bash
mkdir -p apps/pwa/src/shared/components/auth
cp apps/pwa/src/components/auth/AccessRoute.tsx apps/pwa/src/shared/components/auth/
cp apps/pwa/src/components/auth/AuthLayout.tsx apps/pwa/src/shared/components/auth/
cp apps/pwa/src/components/auth/RouteGuards.tsx apps/pwa/src/shared/components/auth/
```

In `apps/pwa/src/shared/components/auth/AccessRoute.tsx`, update:
```ts
// Old:
import { useAuth } from "@/context/AuthProvider";
// New:
import { useAuth } from "@/shared/context/AuthProvider";
```

In `apps/pwa/src/shared/components/auth/RouteGuards.tsx`, update:
```ts
// Old:
import { useAuth } from "@/context/AuthProvider";
// New:
import { useAuth } from "@/shared/context/AuthProvider";
```

`AuthLayout.tsx` has no internal `@/` imports — copy as-is, no changes needed.

- [x] **Step 2: Copy ui components (excluding TagPicker)**

```bash
mkdir -p apps/pwa/src/shared/components/ui
cp apps/pwa/src/components/ui/Button.tsx apps/pwa/src/shared/components/ui/
cp apps/pwa/src/components/ui/Chip.tsx apps/pwa/src/shared/components/ui/
cp apps/pwa/src/components/ui/Icon.tsx apps/pwa/src/shared/components/ui/
cp apps/pwa/src/components/ui/StatCard.tsx apps/pwa/src/shared/components/ui/
cp apps/pwa/src/components/ui/fields.tsx apps/pwa/src/shared/components/ui/
```

`StatCard.tsx` uses `"./Chip"` — relative import still valid in new location. No changes needed.
`Button.tsx`, `Chip.tsx`, `Icon.tsx`, `fields.tsx` — no internal `@/` imports. No changes needed.

- [x] **Step 3: Copy layout components**

```bash
mkdir -p apps/pwa/src/shared/components/layout
cp apps/pwa/src/components/layout/*.tsx apps/pwa/src/shared/components/layout/
```

Files that use `../ui/` relative imports (`ActivityFeed`, `EmptyState`, `FilterBar`, `Toolbar`) — these still resolve correctly since `shared/components/layout/` is still adjacent to `shared/components/ui/`. **No changes needed.**

In `apps/pwa/src/shared/components/layout/AppShell.tsx`, update:
```ts
// Old:
import { useAuth } from "@/context/AuthProvider";
import { useCachedQuery } from "@/lib/core";
import { ... } from "@/features/system/workspace-api";
// New:
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/shared/api/workspace-api";
```

In `apps/pwa/src/shared/components/layout/TopBar.tsx`, update:
```ts
// Old:
import type { WorkspaceNotification } from "@/features/system/workspace-api";
// New:
import type { WorkspaceNotification } from "@/shared/api/workspace-api";
```

`MobileBottomNav.tsx`, `PageHeader.tsx`, `RightRail.tsx`, `SectionCard.tsx`, `Sidebar.tsx` — no internal `@/` imports. No changes needed.

- [x] **Step 4: Delete old components directory**

```bash
rm -rf apps/pwa/src/components
```

---

## Task 4: Co-locate requests API into features/requests/

The pages (`RequestsListPage`, `RequestDetailsPage`, `new/*`) stay where they are. We pull `requests-api.ts`, `requests-data.ts`, and `request-helpers.ts` *into* the same folder.

**Files:**
- Create: `src/features/requests/requests-api.ts`
- Create: `src/features/requests/requests-data.ts`
- Create: `src/features/requests/request-helpers.ts`
- Delete: `src/api/requests/`, `src/lib/requests/`

- [x] **Step 1: Move `requests-api.ts`**

```bash
cp apps/pwa/src/api/requests/requests-api.ts apps/pwa/src/features/requests/requests-api.ts
```

In `apps/pwa/src/features/requests/requests-api.ts`, update:
```ts
// Old:
import { httpRequest } from "@/lib/core";
// New:
import { httpRequest } from "@/shared/lib/core";
```

- [x] **Step 2: Move `requests-data.ts`**

```bash
cp apps/pwa/src/lib/requests/requests-data.ts apps/pwa/src/features/requests/requests-data.ts
```

Only imports from `@stanforte/shared` — no `@/` imports. No changes needed.

- [x] **Step 3: Move `request-helpers.ts`**

```bash
cp apps/pwa/src/lib/requests/request-helpers.ts apps/pwa/src/features/requests/request-helpers.ts
```

In `apps/pwa/src/features/requests/request-helpers.ts`, update:
```ts
// Old:
import type { RequestRecord, RequestTypeOption } from "@/api/requests/requests-api";
// New:
import type { RequestRecord, RequestTypeOption } from "@/features/requests/requests-api";
```

- [x] **Step 4: Delete old locations**

```bash
rm -rf apps/pwa/src/api/requests
rm -rf apps/pwa/src/lib/requests
rmdir apps/pwa/src/lib 2>/dev/null || true
```

---

## Task 5: Move features/taxonomy and features/files

**Files:**
- Create: `src/features/taxonomy/taxonomy-api.ts`
- Create: `src/features/taxonomy/TagPicker.tsx`
- Create: `src/features/files/files-api.ts`
- Delete: `src/api/taxonomy-api.ts`, `src/components/ui/TagPicker.tsx`, `src/api/files/`

- [x] **Step 1: Create `src/features/taxonomy/taxonomy-api.ts`**

```bash
mkdir -p apps/pwa/src/features/taxonomy
cp apps/pwa/src/api/taxonomy-api.ts apps/pwa/src/features/taxonomy/taxonomy-api.ts
```

In `apps/pwa/src/features/taxonomy/taxonomy-api.ts`, update:
```ts
// Old:
import { httpRequest } from "@/lib/core";
// New:
import { httpRequest } from "@/shared/lib/core";
```

- [x] **Step 2: Create `src/features/taxonomy/TagPicker.tsx`**

TagPicker is co-located with taxonomy because it directly depends on `taxonomy-api` and is only used by `RequestFormPage`.

```bash
cp apps/pwa/src/components/ui/TagPicker.tsx apps/pwa/src/features/taxonomy/TagPicker.tsx
```

In `apps/pwa/src/features/taxonomy/TagPicker.tsx`, update:
```ts
// Old:
import { suggestTagTerms, type TagTerm } from "@/api/taxonomy-api";
// New:
import { suggestTagTerms, type TagTerm } from "@/features/taxonomy/taxonomy-api";
```

- [x] **Step 3: Create `src/features/files/files-api.ts`**

```bash
mkdir -p apps/pwa/src/features/files
cp apps/pwa/src/api/files/files-api.ts apps/pwa/src/features/files/files-api.ts
```

In `apps/pwa/src/features/files/files-api.ts`, update:
```ts
// Old:
import { httpRequest } from "@/lib/core";
// New:
import { httpRequest } from "@/shared/lib/core";
```

- [x] **Step 4: Delete old source files**

```bash
rm apps/pwa/src/api/taxonomy-api.ts
rm -rf apps/pwa/src/api/files
```

---

## Task 6: Move modules/hr

**Files:**
- Create: `src/modules/hr/attendance-api.ts`
- Create: `src/modules/hr/attendance-data.ts`
- Create: `src/modules/hr/AttendancePage.tsx`
- Delete: `src/api/attendance/`, `src/features/attendance/`

- [x] **Step 1: Create HR module**

```bash
mkdir -p apps/pwa/src/modules/hr
cp apps/pwa/src/api/attendance/attendance-api.ts apps/pwa/src/modules/hr/attendance-api.ts
cp apps/pwa/src/api/attendance/attendance-data.ts apps/pwa/src/modules/hr/attendance-data.ts
cp apps/pwa/src/features/attendance/AttendancePage.tsx apps/pwa/src/modules/hr/AttendancePage.tsx
```

- [x] **Step 2: Update `modules/hr/attendance-api.ts`**

```ts
// Old:
import { httpRequest } from "@/lib/core";
// New:
import { httpRequest } from "@/shared/lib/core";
```

`attendance-data.ts` — no internal `@/` imports. No changes needed.

- [x] **Step 3: Update `modules/hr/AttendancePage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useCachedQuery } from "@/lib/core";
import { ... } from "@/lib/requests/requests-data";
import { ... } from "../../api/attendance/attendance-api";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/modules/hr/attendance-api";
```

- [x] **Step 4: Delete old locations**

```bash
rm -rf apps/pwa/src/api/attendance
rm -rf apps/pwa/src/features/attendance
```

---

## Task 7: Move modules/finance

**Files:**
- Create: `src/modules/finance/finance-api.ts`
- Create: `src/modules/finance/FinanceDashboardPage.tsx`
- Create: `src/modules/finance/FinancePaymentVouchersPage.tsx`
- Create: `src/modules/finance/FinanceRequestDetailsPage.tsx`
- Create: `src/modules/finance/FinanceRequestsPage.tsx`
- Delete: `src/api/finance/`, `src/features/finance/`

- [x] **Step 1: Create `src/modules/finance/finance-api.ts`**

```bash
mkdir -p apps/pwa/src/modules/finance
cp apps/pwa/src/api/finance/finance-api.ts apps/pwa/src/modules/finance/finance-api.ts
```

In `apps/pwa/src/modules/finance/finance-api.ts`, update:
```ts
// Old:
import { httpRequest } from "@/lib/core";
import type { RequestRecord } from "@/api/requests/requests-api";
// New:
import { httpRequest } from "@/shared/lib/core";
import type { RequestRecord } from "@/features/requests/requests-api";
```

- [x] **Step 2: Copy finance pages**

```bash
cp apps/pwa/src/features/finance/requests/FinanceDashboardPage.tsx apps/pwa/src/modules/finance/
cp apps/pwa/src/features/finance/requests/FinancePaymentVouchersPage.tsx apps/pwa/src/modules/finance/
cp apps/pwa/src/features/finance/requests/FinanceRequestDetailsPage.tsx apps/pwa/src/modules/finance/
cp apps/pwa/src/features/finance/requests/FinanceRequestsPage.tsx apps/pwa/src/modules/finance/
```

- [x] **Step 3: Update `FinanceDashboardPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { ... } from "@/lib/requests/requests-data";
import { ... } from "@/lib/requests/request-helpers";
import type { RequestRecord } from "@/api/requests/requests-api";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { ... } from "../../../api/finance/finance-api";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/request-helpers";
import type { RequestRecord } from "@/features/requests/requests-api";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/modules/finance/finance-api";
```

- [x] **Step 4: Update `FinancePaymentVouchersPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { ... } from "@/lib/requests/requests-data";
import { ... } from "@/lib/requests/request-helpers";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { listFinancePaymentVouchers } from "../../../api/finance/finance-api";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/request-helpers";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useCachedQuery } from "@/shared/lib/core";
import { listFinancePaymentVouchers } from "@/modules/finance/finance-api";
```

- [x] **Step 5: Update `FinanceRequestDetailsPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/lib/core";
import { ... } from "../../../lib/requests/requests-data";
import { ... } from "../../../api/requests/requests-api";
import { ... } from "../../../api/taxonomy-api";
import { listFileAssets, uploadFileAsset } from "@/api/files/files-api";
import { ... } from "../../../api/finance/finance-api";
import { downloadBase64File } from "@/lib/download";
import { ... } from "@/lib/requests/request-helpers";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/requests-api";
import { ... } from "@/features/taxonomy/taxonomy-api";
import { listFileAssets, uploadFileAsset } from "@/features/files/files-api";
import { ... } from "@/modules/finance/finance-api";
import { downloadBase64File } from "@/shared/lib/download";
import { ... } from "@/features/requests/request-helpers";
```

- [x] **Step 6: Update `FinanceRequestsPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { ... } from "@/lib/requests/requests-data";
import { ... } from "@/lib/requests/request-helpers";
import type { RequestRecord } from "@/api/requests/requests-api";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { ... } from "../../../api/finance/finance-api";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/request-helpers";
import type { RequestRecord } from "@/features/requests/requests-api";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/modules/finance/finance-api";
```

- [x] **Step 7: Delete old locations**

```bash
rm -rf apps/pwa/src/api/finance
rm -rf apps/pwa/src/features/finance
rmdir apps/pwa/src/api 2>/dev/null || true
```

---

## Task 8: Update features/requests pages (import paths only)

The pages stay in place. Only their imports need updating to point at the newly co-located files and moved shared paths.

**Files to modify (in place):**
- `src/features/requests/RequestsListPage.tsx`
- `src/features/requests/RequestDetailsPage.tsx`
- `src/features/requests/new/RequestTypePage.tsx`
- `src/features/requests/new/RequestFormPage.tsx`
- `src/features/requests/new/FinancialRequestFormPage.tsx`

- [x] **Step 1: Update `RequestsListPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useCachedQuery } from "@/lib/core";
import { useAuth } from "@/context/AuthProvider";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { listApprovals, listRequests, listRequestTypes, type RequestRecord } from "@/api/requests/requests-api";
import { buildRequestsNavigation, requestsMobileNav } from "@/lib/requests/requests-data";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useCachedQuery } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listApprovals, listRequests, listRequestTypes, type RequestRecord } from "@/features/requests/requests-api";
import { buildRequestsNavigation, requestsMobileNav } from "@/features/requests/requests-data";
```

- [x] **Step 2: Update `RequestDetailsPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/lib/core";
import { ... } from "../../lib/requests/requests-data";
import { ... } from "../../api/requests/requests-api";
import { listEntityTags, listManagedTaxonomies } from "../../api/taxonomy-api";
import { listFileAssets, uploadFileAsset } from "@/api/files/files-api";
import { ... } from "../../api/finance/finance-api";
import { downloadBase64File } from "@/lib/download";
import { ... } from "@/lib/requests/request-helpers";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/requests-api";
import { listEntityTags, listManagedTaxonomies } from "@/features/taxonomy/taxonomy-api";
import { listFileAssets, uploadFileAsset } from "@/features/files/files-api";
import { ... } from "@/modules/finance/finance-api";
import { downloadBase64File } from "@/shared/lib/download";
import { ... } from "@/features/requests/request-helpers";
```

- [x] **Step 3: Update `new/RequestTypePage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useCachedQuery } from "@/lib/core";
import { buildRequestsNavigation, requestsMobileNav } from "@/lib/requests/requests-data";
import { listRequestTypes, type RequestTypeOption } from "../../../api/requests/requests-api";
import { requestFamilyFromType, requestFamilyLabel, type RequestFamily } from "@/lib/requests/request-helpers";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useCachedQuery } from "@/shared/lib/core";
import { buildRequestsNavigation, requestsMobileNav } from "@/features/requests/requests-data";
import { listRequestTypes, type RequestTypeOption } from "@/features/requests/requests-api";
import { requestFamilyFromType, requestFamilyLabel, type RequestFamily } from "@/features/requests/request-helpers";
```

- [x] **Step 4: Update `new/RequestFormPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { TagPicker } from "@/components/ui/TagPicker";
import { useCachedQuery } from "@/lib/core";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { ... } from "@/lib/requests/requests-data";
import { ... } from "../../../api/requests/requests-api";
import { ... } from "@/lib/requests/request-helpers";
import { ... } from "../../../api/taxonomy-api";
import { uploadFileAsset } from "@/api/files/files-api";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { TagPicker } from "@/features/taxonomy/TagPicker";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { ... } from "@/features/requests/requests-data";
import { ... } from "@/features/requests/requests-api";
import { ... } from "@/features/requests/request-helpers";
import { ... } from "@/features/taxonomy/taxonomy-api";
import { uploadFileAsset } from "@/features/files/files-api";
```

- [x] **Step 5: Update `new/FinancialRequestFormPage.tsx`**

```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { ... } from "@/lib/requests/requests-data";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { ... } from "@/features/requests/requests-data";
```

---

## Task 9: Move pages/auth, pages/dashboard, pages/system

**Files:**
- Create: `src/pages/auth/` (5 files)
- Create: `src/pages/dashboard/DashboardPage.tsx`
- Create: `src/pages/system/` (6 files)
- Delete: `src/features/auth/`, `src/features/dashboard/`, `src/features/system/`

- [x] **Step 1: Move auth pages**

```bash
mkdir -p apps/pwa/src/pages/auth
cp apps/pwa/src/features/auth/*.tsx apps/pwa/src/pages/auth/
```

In `AcceptInvitePage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, update:
```ts
// Old:
import { authApi } from "@/lib/core";
// New:
import { authApi } from "@/shared/lib/core";
```

In `LoginPage.tsx`, `SessionReauthPage.tsx`, update:
```ts
// Old:
import { useAuth } from "@/context/AuthProvider";
// New:
import { useAuth } from "@/shared/context/AuthProvider";
```

- [x] **Step 2: Move dashboard page**

```bash
mkdir -p apps/pwa/src/pages/dashboard
cp apps/pwa/src/features/dashboard/DashboardPage.tsx apps/pwa/src/pages/dashboard/
```

In `apps/pwa/src/pages/dashboard/DashboardPage.tsx`, update:
```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { getMyAttendance } from "@/api/attendance/attendance-api";
import { ... } from "@/lib/requests/requests-data";
import { listApprovals, listRequests } from "@/api/requests/requests-api";
import { ... } from "@/lib/requests/request-helpers";
import { ... } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { getMyAttendance } from "@/modules/hr/attendance-api";
import { ... } from "@/features/requests/requests-data";
import { listApprovals, listRequests } from "@/features/requests/requests-api";
import { ... } from "@/features/requests/request-helpers";
import { ... } from "@/shared/api/workspace-api";
import { useCachedQuery } from "@/shared/lib/core";
```

- [x] **Step 3: Move system pages**

```bash
mkdir -p apps/pwa/src/pages/system
cp apps/pwa/src/features/system/HelpPage.tsx apps/pwa/src/pages/system/
cp apps/pwa/src/features/system/NotificationsPage.tsx apps/pwa/src/pages/system/
cp apps/pwa/src/features/system/ProfilePage.tsx apps/pwa/src/pages/system/
cp apps/pwa/src/features/system/SettingsPage.tsx apps/pwa/src/pages/system/
cp apps/pwa/src/features/system/index.ts apps/pwa/src/pages/system/
cp apps/pwa/src/features/system/page-helpers.tsx apps/pwa/src/pages/system/
```

In `apps/pwa/src/pages/system/page-helpers.tsx`, update:
```ts
// Old:
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthProvider";
import { ... } from "@/lib/requests/requests-data";
// New:
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { ... } from "@/features/requests/requests-data";
```

In `apps/pwa/src/pages/system/NotificationsPage.tsx`, update:
```ts
// Old:
import { useCachedQuery } from "@/lib/core";
import { ... } from "./workspace-api";
// New:
import { useCachedQuery } from "@/shared/lib/core";
import { ... } from "@/shared/api/workspace-api";
```

In `apps/pwa/src/pages/system/ProfilePage.tsx`, update:
```ts
// Old:
import { useCachedQuery } from "@/lib/core";
import { useAuth } from "@/context/AuthProvider";
import { getWorkspaceProfile, updateWorkspaceProfile } from "./workspace-api";
// New:
import { useCachedQuery } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";
import { getWorkspaceProfile, updateWorkspaceProfile } from "@/shared/api/workspace-api";
```

In `apps/pwa/src/pages/system/SettingsPage.tsx`, update:
```ts
// Old:
import { changeWorkspacePassword } from "./workspace-api";
// New:
import { changeWorkspacePassword } from "@/shared/api/workspace-api";
```

`HelpPage.tsx` uses `"./page-helpers"` — still valid in same folder. **No change needed.**
`index.ts` re-exports via relative `"./"` paths — **no change needed.**

- [x] **Step 4: Delete old features/**

```bash
rm -rf apps/pwa/src/features/auth
rm -rf apps/pwa/src/features/dashboard
rm -rf apps/pwa/src/features/system
rmdir apps/pwa/src/features 2>/dev/null || true
```

Note: `features/` should NOT be removed — it still contains `requests/`, `files/`, `taxonomy/`.

---

## Task 10: Update App.tsx and main.tsx

- [x] **Step 1: Update `src/main.tsx`**

```ts
// Old:
import { AuthProvider } from "@/context/AuthProvider";
// New:
import { AuthProvider } from "@/shared/context/AuthProvider";
```

- [x] **Step 2: Update `src/App.tsx`**

```ts
// Old:
import AttendancePage from "@/features/attendance/AttendancePage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import FinanceDashboardPage from "@/features/finance/requests/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/features/finance/requests/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/features/finance/requests/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/features/finance/requests/FinanceRequestsPage";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/RouteGuards";
import { ApprovalRoute, ModuleRoute } from "@/components/auth/AccessRoute";
import AcceptInvitePage from "@/features/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import LoginPage from "@/features/auth/LoginPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";
import SessionReauthPage from "@/features/auth/SessionReauthPage";
import RequestDetailsPage from "@/features/requests/RequestDetailsPage";
import RequestFormPage from "@/features/requests/new/RequestFormPage";
import RequestTypePage from "@/features/requests/new/RequestTypePage";
import RequestsListPage from "@/features/requests/RequestsListPage";
import { SettingsPage, NotificationsPage, HelpPage, ProfilePage } from "@/features/system";
// New:
import AttendancePage from "@/modules/hr/AttendancePage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FinanceDashboardPage from "@/modules/finance/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/modules/finance/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/modules/finance/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/modules/finance/FinanceRequestsPage";
import { ProtectedRoute, PublicOnlyRoute } from "@/shared/components/auth/RouteGuards";
import { ApprovalRoute, ModuleRoute } from "@/shared/components/auth/AccessRoute";
import AcceptInvitePage from "@/pages/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import SessionReauthPage from "@/pages/auth/SessionReauthPage";
import RequestDetailsPage from "@/features/requests/RequestDetailsPage";
import RequestFormPage from "@/features/requests/new/RequestFormPage";
import RequestTypePage from "@/features/requests/new/RequestTypePage";
import RequestsListPage from "@/features/requests/RequestsListPage";
import { SettingsPage, NotificationsPage, HelpPage, ProfilePage } from "@/pages/system";
```

---

## Task 11: Final verification and cleanup

- [x] **Step 1: Run TypeScript check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [x] **Step 2: Run build**

```bash
cd apps/pwa && npm run build 2>&1
```

Expected: successful build.

- [x] **Step 3: Verify no stale old paths remain**

```bash
grep -r \
  "@/lib/core\|@/lib/env\|@/lib/download\|@/lib/requests\|@/context/\|@/components/\|@/api/\|@/features/system\|@/features/attendance\|@/features/finance\|@/features/dashboard\|@/features/auth" \
  apps/pwa/src --include="*.ts" --include="*.tsx"
```

Expected: no output.

- [x] **Step 4: Verify remaining structure**

```bash
find apps/pwa/src -type d | sort
```

Expected directories:
```
src/
src/features/
src/features/files/
src/features/requests/
src/features/requests/new/
src/features/taxonomy/
src/modules/
src/modules/finance/
src/modules/hr/
src/pages/
src/pages/auth/
src/pages/dashboard/
src/pages/system/
src/shared/
src/shared/api/
src/shared/components/
src/shared/components/auth/
src/shared/components/layout/
src/shared/components/ui/
src/shared/context/
src/shared/lib/
```

- [ ] **Step 5: Commit**

```bash
git add -A apps/pwa/src
git commit -m "refactor(pwa): reorganize src into module-first structure

modules/: finance (admin views), hr (attendance + future leave)
features/: requests (shared workflow engine), files, taxonomy
shared/: components, context, lib, api (workspace-api elevated here)
pages/: auth, dashboard, system

Requests stays a feature — Finance/HR/Admin consume it
with their own filtered module views.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

- [x] `requests` is a `feature/` not a `module/` — shared engine consumed by finance/hr/admin module views
- [x] `workspace-api` in `shared/api/` — used by layout components + 6 pages across modules
- [x] `TagPicker` in `features/taxonomy/` — tightly coupled to taxonomy-api, only used by RequestFormPage
- [x] Finance pages switch from `"../../../api/finance/..."` relative → `@/modules/finance/...` absolute
- [x] `features/requests/` pages stay in place — only their imports update + api files co-located
- [x] `system/index.ts` barrel exports unchanged (relative paths still valid)
- [x] Layout `../ui/` relative imports survive the move to `shared/components/layout/`
- [x] No old `api/` or `lib/requests/` directories survive after Task 7
