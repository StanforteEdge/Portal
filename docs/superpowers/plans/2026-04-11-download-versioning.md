# Download Page & Versioning System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a download icon to the desktop top bar that links to a `/download` page showing the current app version, platform download buttons, and a changelog parsed from `CHANGELOG.md` at build time.

**Architecture:** Version lives in `apps/pwa/package.json`; a Vite plugin reads `CHANGELOG.md` and injects `VITE_APP_VERSION`, `VITE_APP_BUILD_DATE`, and `VITE_CHANGELOG` (JSON string) at build time. The `DownloadPage` component reads these env vars. The `DesktopTopBar` gets a download icon button between notifications and the profile button.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite 5, `@/shared` components (`Icon`, `SectionCard`), `SystemShellPage` layout wrapper, `NavLink` from `react-router-dom`.

---

## File Map

| File | Action |
|---|---|
| `apps/pwa/CHANGELOG.md` | Create — version history |
| `apps/pwa/package.json` | Modify — bump version to `1.0.0` |
| `apps/pwa/vite.config.ts` | Modify — inject version/date/changelog env vars |
| `apps/pwa/src/pages/system/DownloadPage.tsx` | Create — download page component |
| `apps/pwa/src/pages/system/index.ts` | Modify — export DownloadPage |
| `apps/pwa/src/App.tsx` | Modify — add `/download` route |
| `apps/pwa/src/shared/components/layout/TopBar.tsx` | Modify — add download icon to DesktopTopBar |

---

## Task 1: Create CHANGELOG.md and bump version

**Files:**
- Create: `apps/pwa/CHANGELOG.md`
- Modify: `apps/pwa/package.json`

- [ ] **Step 1: Create `apps/pwa/CHANGELOG.md`**

```markdown
# Changelog

## [1.0.0] — 2026-04-11

### Added
- Download page with platform download buttons and changelog
- Download icon in desktop top bar
- Versioning system using package.json as source of truth

### Changed
- Approvals page: replaced Type with Category column, added Team column, replaced Submitted with Due Date
- Requests list: team name now resolved from profile groups

### Fixed
- Desktop app WebKit ATS issue with localhost API on macOS
- Stale PostgreSQL lock file on macOS
```

- [ ] **Step 2: Update version in `apps/pwa/package.json`**

Change `"version": "0.0.0"` to `"version": "1.0.0"`.

```json
{
  "name": "stanforte-react-pwa2",
  "version": "1.0.0",
  ...
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/CHANGELOG.md apps/pwa/package.json
git commit -m "chore: bump version to 1.0.0 and add CHANGELOG"
```

---

## Task 2: Inject version/changelog env vars in Vite config

**Files:**
- Modify: `apps/pwa/vite.config.ts`

This task adds three env vars available to the React app:
- `VITE_APP_VERSION` — e.g. `"1.0.0"` (from `package.json`)
- `VITE_APP_BUILD_DATE` — e.g. `"2026-04-11"` (from build time)
- `VITE_CHANGELOG` — JSON string of parsed changelog entries

The Vite `define` field injects these as compile-time constants via `import.meta.env.*`.

- [ ] **Step 1: Replace `apps/pwa/vite.config.ts` with the version below**

```ts
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Read package.json version
const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
) as { version: string };

// Parse CHANGELOG.md into JSON
function parseChangelog(md: string) {
  const entries: Array<{
    version: string;
    date: string;
    sections: Record<string, string[]>;
  }> = [];

  let current: (typeof entries)[0] | null = null;
  let currentSection = "";

  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const versionMatch = line.match(/^## \[(.+?)\] ?[—-] ?(.+)/);
    if (versionMatch) {
      if (current) entries.push(current);
      current = { version: versionMatch[1], date: versionMatch[2].trim(), sections: {} };
      currentSection = "";
      continue;
    }
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && current) {
      currentSection = sectionMatch[1];
      current.sections[currentSection] = [];
      continue;
    }
    const bulletMatch = line.match(/^- (.+)/);
    if (bulletMatch && current && currentSection) {
      current.sections[currentSection].push(bulletMatch[1]);
    }
  }
  if (current) entries.push(current);
  return entries;
}

const changelogMd = readFileSync(new URL("./CHANGELOG.md", import.meta.url), "utf-8");
const changelog = parseChangelog(changelogMd);
const buildDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_APP_BASE_PATH || "/";

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
      "import.meta.env.VITE_APP_BUILD_DATE": JSON.stringify(buildDate),
      "import.meta.env.VITE_CHANGELOG": JSON.stringify(JSON.stringify(changelog)),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
```

- [ ] **Step 2: Verify the dev server starts without errors**

```bash
cd apps/pwa && npm run dev
```

Expected: Vite starts on port 5173 with no TypeScript or parse errors. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/vite.config.ts
git commit -m "feat: inject VITE_APP_VERSION, VITE_APP_BUILD_DATE, VITE_CHANGELOG at build time"
```

---

## Task 3: Create DownloadPage component

**Files:**
- Create: `apps/pwa/src/pages/system/DownloadPage.tsx`

The page reads the three injected env vars and renders: version badge, platform download buttons (macOS ARM, macOS Intel, Windows, Linux), and the changelog list.

Download buttons link to `${VITE_DOWNLOAD_BASE_URL}/v{version}/{filename}`. If `VITE_DOWNLOAD_BASE_URL` is not set, buttons are disabled with a "Not yet available" state.

- [ ] **Step 1: Create `apps/pwa/src/pages/system/DownloadPage.tsx`**

```tsx
import { Icon, SectionCard } from "@/shared";
import { SystemShellPage } from "./page-helpers";

interface ChangelogSection {
  Added?: string[];
  Changed?: string[];
  Fixed?: string[];
  [key: string]: string[] | undefined;
}

interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection;
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION as string | undefined ?? "—";
const BUILD_DATE = import.meta.env.VITE_APP_BUILD_DATE as string | undefined ?? "";
const DOWNLOAD_BASE = import.meta.env.VITE_DOWNLOAD_BASE_URL as string | undefined ?? "";

function parseChangelog(): ChangelogEntry[] {
  const raw = import.meta.env.VITE_CHANGELOG as string | undefined;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChangelogEntry[];
  } catch {
    return [];
  }
}

const PLATFORMS: Array<{
  label: string;
  filename: (v: string) => string;
  icon: string;
}> = [
  {
    label: "macOS (Apple Silicon)",
    filename: (v) => `Stanforte.Portal_${v}_aarch64.dmg`,
    icon: "laptop_mac",
  },
  {
    label: "macOS (Intel)",
    filename: (v) => `Stanforte.Portal_${v}_x64.dmg`,
    icon: "laptop_mac",
  },
  {
    label: "Windows",
    filename: (v) => `Stanforte.Portal_${v}_x64-setup.exe`,
    icon: "desktop_windows",
  },
  {
    label: "Linux (.AppImage)",
    filename: (v) => `Stanforte.Portal_${v}_amd64.AppImage`,
    icon: "terminal",
  },
];

export default function DownloadPage() {
  const entries = parseChangelog();

  return (
    <SystemShellPage
      activeLabel=""
      breadcrumbs={[
        { label: "Workspace", path: "/profile" },
        { label: "Download" },
      ]}
      eyebrow="Workspace > Download"
      title="Download Stanforte Portal"
      description="Get the native desktop app for a faster, offline-capable experience."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard
            title="Desktop App"
            description="Download the latest build for your operating system."
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-slate-900">
                Version {APP_VERSION}
              </span>
              {BUILD_DATE ? (
                <span className="text-sm text-slate-400">— Built {BUILD_DATE}</span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PLATFORMS.map((platform) => {
                const href = DOWNLOAD_BASE
                  ? `${DOWNLOAD_BASE}/v${APP_VERSION}/${platform.filename(APP_VERSION)}`
                  : undefined;
                return (
                  <a
                    key={platform.label}
                    href={href}
                    aria-disabled={!href}
                    className={[
                      "flex items-center gap-3 rounded-2xl border px-5 py-4 transition",
                      href
                        ? "border-slate-200 bg-white hover:border-brand-900/30 hover:bg-slate-50 cursor-pointer"
                        : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed pointer-events-none",
                    ].join(" ")}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-900/10 text-brand-900">
                      <Icon name={platform.icon} className="text-[20px]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {platform.label}
                      </p>
                      {!href ? (
                        <p className="text-xs text-slate-400">Not yet available</p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {platform.filename(APP_VERSION)}
                        </p>
                      )}
                    </div>
                    {href ? (
                      <Icon name="download" className="text-[20px] text-slate-400 shrink-0" />
                    ) : null}
                  </a>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Changelog"
            description="What changed in each release."
          >
            {entries.length === 0 ? (
              <p className="text-sm text-slate-400">No changelog available.</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.version}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-sm font-bold text-brand-900">
                        v{entry.version}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        {entry.date}
                      </span>
                    </div>
                    {Object.entries(entry.sections).map(([section, items]) =>
                      items && items.length > 0 ? (
                        <div key={section} className="mb-2 last:mb-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {section}
                          </p>
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-600">
                                <span className="text-slate-300 shrink-0">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SectionCard title="PWA (Web App)">
            <p className="text-sm leading-6 text-slate-600">
              The portal is also available as a Progressive Web App — no installation required. Open it in any modern browser and add it to your home screen.
            </p>
          </SectionCard>
        </div>
      </div>
    </SystemShellPage>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/system/DownloadPage.tsx
git commit -m "feat: add DownloadPage with version, platform buttons, and changelog"
```

---

## Task 4: Export DownloadPage and add route

**Files:**
- Modify: `apps/pwa/src/pages/system/index.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add export to `apps/pwa/src/pages/system/index.ts`**

```ts
export { default as SettingsPage } from "./SettingsPage";
export { default as NotificationsPage } from "./NotificationsPage";
export { default as HelpPage } from "./HelpPage";
export { default as ProfilePage } from "./ProfilePage";
export { default as DownloadPage } from "./DownloadPage";
```

- [ ] **Step 2: Add import and route to `apps/pwa/src/App.tsx`**

Add `DownloadPage` to the existing import from `@/pages/system`:

```tsx
import {
  HelpPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
  DownloadPage,
} from "@/pages/system";
```

Add the route inside `<Route element={<ProtectedRoute />}>`, after the `/help` route:

```tsx
<Route path="/help" element={<HelpPage />} />
<Route path="/download" element={<DownloadPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

- [ ] **Step 3: Verify in browser**

Start dev server (`npm run dev` in `apps/pwa`), navigate to `http://localhost:5173/download`. Expected: page renders with version, 4 platform cards (disabled since no `VITE_DOWNLOAD_BASE_URL`), and changelog.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/system/index.ts apps/pwa/src/App.tsx
git commit -m "feat: register /download route"
```

---

## Task 5: Add download icon to DesktopTopBar

**Files:**
- Modify: `apps/pwa/src/shared/components/layout/TopBar.tsx`

The download icon button is a `NavLink` (not a `button`) placed between the notifications `div` and the profile `div` inside `<div className="flex items-center gap-3 px-6">`. It uses the same `iconButtonClass(active)` helper pattern.

- [ ] **Step 1: Add the `NavLink` import** — it's already imported at the top of the file (`import { NavLink, useLocation } from "react-router-dom";`). No change needed.

- [ ] **Step 2: Insert the download icon button in `DesktopTopBar`**

Find this block in `DesktopTopBar` (around line 196):

```tsx
      <div className="flex items-center gap-3 px-6">
        <div className="text-on-surface-variant">
          <div className="relative" ref={notificationRef}>
```

Replace with:

```tsx
      <div className="flex items-center gap-3 px-6">
        <NavLink
          to="/download"
          className={({ isActive }) =>
            `${iconButtonClass(isActive)} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10`
          }
          aria-label="Download desktop app"
        >
          <Icon name="download" />
        </NavLink>

        <div className="text-on-surface-variant">
          <div className="relative" ref={notificationRef}>
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:5173`. The top bar should show a download icon between the search bar area and the notification bell. Clicking it routes to `/download`. The icon is highlighted when on `/download`.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/shared/components/layout/TopBar.tsx
git commit -m "feat: add download icon to desktop top bar"
```

---

## Done

All tasks complete. The feature is fully functional:
- `VITE_APP_VERSION` = `"1.0.0"` injected at build time
- `VITE_CHANGELOG` parsed from `CHANGELOG.md` at build time
- `/download` page renders version, platform buttons, and changelog
- Desktop top bar has a download icon linking to `/download`
