# Shared Package Cleanup — Extract DOM Components to PWA

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strip `@stanforte/shared` down to platform-agnostic code only (auth, data, utils), move all DOM components into `apps/pwa/`, and create a clean local barrel so the PWA has one import path for its own components.

**Architecture:** The PWA already has better, auth-aware versions of most layout/ui components. Only 7 components are missing and need to be moved in. Everything else in `apps/shared/src/layout/` and `apps/shared/src/ui/` gets deleted (superseded). A new `@/shared` barrel in the PWA replaces `@stanforte/shared` for all DOM imports.

**Tech Stack:** React, TypeScript, Vite, npm workspaces. `@/` alias → `apps/pwa/src/`.

---

## Target State

```
apps/shared/src/               ← @stanforte/shared (PLATFORM-AGNOSTIC ONLY)
  auth/                        ← keep as-is
  data/                        ← keep as-is
  utils/                       ← keep as-is
  index.ts                     ← stripped: auth + data + utils only

apps/pwa/src/shared/
  components/
    auth/                      ← unchanged (RouteGuards, AccessRoute, AuthLayout)
    layout/                    ← PWA versions + 3 new arrivals from shared
      + Breadcrumbs.tsx        ← moved from apps/shared
      + MobileMenuSheet.tsx    ← moved from apps/shared
      + WorkflowStepper.tsx    ← moved from apps/shared
    ui/                        ← PWA versions + 2 new arrivals
      + PaginationControls.tsx ← moved from apps/shared
      + Table.tsx              ← moved from apps/shared
    feedback/                  ← NEW folder
      + ToastProvider.tsx      ← moved from apps/shared
    media/                     ← NEW folder
      + MediaPickerModal.tsx   ← moved from apps/shared
  api/                         ← unchanged
  context/                     ← unchanged
  lib/                         ← unchanged
  index.ts                     ← NEW: barrel re-exporting all local components
```

---

## Import Changes Summary

### Before
```ts
import { Button, Icon, Chip, AppShell, SectionCard, Table, ... } from "@stanforte/shared";
```

### After
```ts
import { Button, Icon, Chip, AppShell, SectionCard, Table, ... } from "@/shared";
// @stanforte/shared still used for: auth, data, utils
```

---

## What Gets DELETED from `apps/shared/src/`

These are superseded by the PWA's own implementations:

**`layout/`** (all files — PWA has better auth-aware versions):
- AppShell.tsx, ActivityFeed.tsx, EmptyState.tsx, FilterBar.tsx
- MobileBottomNav.tsx, PageHeader.tsx, RightRail.tsx, SectionCard.tsx
- Sidebar.tsx, Toolbar.tsx, TopBar.tsx

**`ui/`** (all files — PWA has custom-branded versions):
- Button.tsx, Chip.tsx, Icon.tsx, StatCard.tsx, fields.tsx

---

## What Gets MOVED from `apps/shared/src/` to `apps/pwa/src/shared/components/`

These don't exist in the PWA yet:

| Source | Destination |
|--------|-------------|
| `layout/Breadcrumbs.tsx` | `shared/components/layout/Breadcrumbs.tsx` |
| `layout/MobileMenuSheet.tsx` | `shared/components/layout/MobileMenuSheet.tsx` |
| `layout/WorkflowStepper.tsx` | `shared/components/layout/WorkflowStepper.tsx` |
| `ui/PaginationControls.tsx` | `shared/components/ui/PaginationControls.tsx` |
| `ui/Table.tsx` | `shared/components/ui/Table.tsx` |
| `feedback/ToastProvider.tsx` | `shared/components/feedback/ToastProvider.tsx` |
| `media/MediaPickerModal.tsx` | `shared/components/media/MediaPickerModal.tsx` |

---

## Tasks

### Task 1: Move 7 missing components from shared → PWA

**Files:**
- Create: `apps/pwa/src/shared/components/layout/Breadcrumbs.tsx`
- Create: `apps/pwa/src/shared/components/layout/MobileMenuSheet.tsx`
- Create: `apps/pwa/src/shared/components/layout/WorkflowStepper.tsx`
- Create: `apps/pwa/src/shared/components/ui/PaginationControls.tsx`
- Create: `apps/pwa/src/shared/components/ui/Table.tsx`
- Create: `apps/pwa/src/shared/components/feedback/ToastProvider.tsx`
- Create: `apps/pwa/src/shared/components/media/MediaPickerModal.tsx`

- [ ] Read each source file in `apps/shared/src/` to check its internal imports

- [ ] Copy each file to the PWA destination. Update any internal imports that reference other `apps/shared` components to use relative paths within `apps/pwa/src/shared/components/`:
  - References to `"./Button"`, `"./Icon"`, `"./Chip"` etc. within shared — rewrite to `"../ui/Button"` etc.
  - References to `"@stanforte/shared"` for auth/data/utils — keep as-is

- [ ] Do NOT delete the originals yet — that happens in Task 3

- [ ] Commit:
  ```bash
  git add -A
  git commit -m "refactor(pwa): move missing shared DOM components into pwa"
  ```

---

### Task 2: Create `apps/pwa/src/shared/index.ts` barrel

This barrel gives the PWA a single clean import path `@/shared` for all its own components, replacing the scattered `@stanforte/shared` DOM imports.

- [ ] Create `apps/pwa/src/shared/index.ts`:

```ts
// Layout
export { AppShell } from "./components/layout/AppShell";
export { ActivityFeed } from "./components/layout/ActivityFeed";
export { Breadcrumbs } from "./components/layout/Breadcrumbs";
export type { BreadcrumbItem } from "./components/layout/Breadcrumbs";
export { EmptyState } from "./components/layout/EmptyState";
export { FilterBar } from "./components/layout/FilterBar";
export { MobileBottomNav } from "./components/layout/MobileBottomNav";
export { MobileMenuSheet } from "./components/layout/MobileMenuSheet";
export { PageHeader } from "./components/layout/PageHeader";
export { RightRail } from "./components/layout/RightRail";
export { SectionCard } from "./components/layout/SectionCard";
export { Sidebar } from "./components/layout/Sidebar";
export type { SidebarItem } from "./components/layout/Sidebar";
export { Toolbar } from "./components/layout/Toolbar";
export { DesktopTopBar, MobileTopBar } from "./components/layout/TopBar";
export { WorkflowStepper } from "./components/layout/WorkflowStepper";
export type { WorkflowStep, WorkflowStepStatus } from "./components/layout/WorkflowStepper";

// UI
export { Button } from "./components/ui/Button";
export { Chip } from "./components/ui/Chip";
export { Icon } from "./components/ui/Icon";
export { PaginationControls } from "./components/ui/PaginationControls";
export { StatCard } from "./components/ui/StatCard";
export { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "./components/ui/Table";
export { InlineSelectField, SelectField, TextAreaField, TextField } from "./components/ui/fields";

// Feedback
export { ToastProvider, useToast } from "./components/feedback/ToastProvider";

// Media
export { MediaPickerModal } from "./components/media/MediaPickerModal";
export type { MediaPickerItem, MediaPickerModalProps } from "./components/media/MediaPickerModal";
```

Note: Check each component file to confirm the exact named exports match. Adjust types if needed.

- [ ] Commit:
  ```bash
  git add apps/pwa/src/shared/index.ts
  git commit -m "feat(pwa): add shared barrel index for local component imports"
  ```

---

### Task 3: Update all PWA imports from `@stanforte/shared` (DOM) → `@/shared`

Every PWA file that currently imports DOM components from `@stanforte/shared` needs updating. Auth/data/utils imports from `@stanforte/shared` stay unchanged.

- [ ] Find all files that import DOM components from `@stanforte/shared`:
  ```bash
  grep -rl "from \"@stanforte/shared\"\|from '@stanforte/shared'" apps/pwa/src --include="*.ts" --include="*.tsx"
  ```

- [ ] For each file, split the import:

  **Before:**
  ```ts
  import { Button, Icon, AppShell, useCachedQuery, formatCurrency } from "@stanforte/shared";
  ```

  **After:**
  ```ts
  import { Button, Icon, AppShell } from "@/shared";
  import { useCachedQuery, formatCurrency } from "@stanforte/shared";
  ```

  DOM items (move to `@/shared`): anything from `layout/`, `ui/`, `feedback/`, `media/` in the original `apps/shared/src/index.ts`.

  Keep in `@stanforte/shared`: `createSessionStorage`, `normalizeTokens`, `createHttpClient`, `createAuthApi`, `hasAnyPermission`, `hasApprovalAccess`, `hasModuleAccess`, `hasPermission`, `AuthSession`, `AuthStatusResponse`, `AuthTokens`, `AuthUser`, `HttpRequest`, `SessionStorageAdapter`, `createCacheStore`, `useCachedQuery`, `CacheStore`, `formatRelativeTime`, `humanize`, `roleLabel`, `sortRoles`, `userDisplayName`, `DEFAULT_CURRENCY`, `formatCurrency`, `normalizeCurrency`.

- [ ] Also update `apps/pwa/src/main.tsx` if it imports `ToastProvider` from `@stanforte/shared`:
  ```ts
  // Old:
  import { ToastProvider } from "@stanforte/shared";
  // New:
  import { ToastProvider } from "@/shared";
  ```

- [ ] Commit:
  ```bash
  git add -A
  git commit -m "refactor(pwa): replace @stanforte/shared DOM imports with @/shared"
  ```

---

### Task 4: Strip `apps/shared/src/index.ts` and delete DOM files

- [ ] Rewrite `apps/shared/src/index.ts` to only export platform-agnostic items:

```ts
// Auth
export { createSessionStorage } from "./auth/storage";
export { normalizeTokens } from "./auth/tokens";
export { createHttpClient } from "./auth/http-client";
export { createAuthApi } from "./auth/api";
export { hasAnyPermission, hasApprovalAccess, hasModuleAccess, hasPermission } from "./auth/access";
export type { AuthSession, AuthStatusResponse, AuthTokens, AuthUser } from "./auth/types";
export type { HttpRequest } from "./auth/http-client";
export type { SessionStorageAdapter } from "./auth/storage";

// Data
export { createCacheStore } from "./data/cache";
export { useCachedQuery } from "./data/useCachedQuery";
export type { CacheStore } from "./data/cache";

// Utils
export { formatRelativeTime, humanize, roleLabel, sortRoles, userDisplayName } from "./utils/display";
export { DEFAULT_CURRENCY, formatCurrency, normalizeCurrency } from "./utils/currency";
```

- [ ] Delete DOM directories from `apps/shared/src/`:
  ```bash
  rm -rf apps/shared/src/layout
  rm -rf apps/shared/src/ui
  rm -rf apps/shared/src/feedback
  rm -rf apps/shared/src/media
  ```

- [ ] Commit:
  ```bash
  git add -A
  git commit -m "refactor(shared): strip DOM components, keep auth/data/utils only"
  ```

---

### Task 5: Final verification

- [ ] TypeScript check:
  ```bash
  cd apps/pwa && npx tsc --noEmit 2>&1
  ```
  Expected: 0 errors

- [ ] Verify no PWA files import DOM components from `@stanforte/shared`:
  ```bash
  grep -r "from \"@stanforte/shared\"" apps/pwa/src --include="*.ts" --include="*.tsx" -A1 | grep -v "//\|auth\|data\|utils\|format\|currency\|role\|sort\|humanize\|Cache\|Session\|Token\|Permission\|Access\|Http" | head -20
  ```

- [ ] Verify `apps/shared/src/` has no DOM files:
  ```bash
  find apps/shared/src -name "*.tsx" | sort
  ```
  Expected: only `.ts` files (no TSX — no React DOM components)

- [ ] Commit final cleanup if needed, then verify build:
  ```bash
  cd apps/pwa && npm run build 2>&1 | tail -10
  ```

---

## Self-Review

- [x] PWA's AppShell is auth-aware and richer than shared's — PWA version wins, shared deleted
- [x] PWA's Button/Chip/Icon etc. are custom-branded — PWA version wins, shared deleted
- [x] 7 components missing from PWA (Breadcrumbs, MobileMenuSheet, WorkflowStepper, PaginationControls, Table, ToastProvider, MediaPickerModal) — moved in Task 1
- [x] `@stanforte/shared` remains importable for auth/data/utils — no breaking changes for future RN/Tauri
- [x] `@/shared` barrel provides clean single import for all PWA DOM components
- [x] `main.tsx` ToastProvider import updated in Task 3
- [x] No circular imports: `@/shared` components only import from `@stanforte/shared` (auth/utils) and each other
