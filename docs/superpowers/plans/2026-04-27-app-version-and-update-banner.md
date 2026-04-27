# App Version & Update Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an auto-incrementing Build Version baked at deploy time, an update banner that fires when a new build is detected, and a System section in Settings showing both App Version and Build Version.

**Architecture:** A Vite plugin writes `public/version.json` at build time using the git commit count offset from a fixed base (332, today's count) to compute a semantic build version. An `AppVersion` component mounts globally and polls that file every 3 minutes. The Settings page reads the baked-in env vars and also supports manual version checks.

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind, `@/shared` component library (`Button`, `SectionCard`, `StatCard`).

---

## File Map

| File | Change |
|------|--------|
| `apps/pwa/vite.config.ts` | Add `execSync` + `writeFileSync` imports; compute `VITE_BUILD_VERSION` and `VITE_APP_BUILT_AT`; add Vite plugin to write `public/version.json` |
| `apps/pwa/src/shared/components/AppVersion.tsx` | New — polls `/version.json`, shows update banner when `built_at` differs |
| `apps/pwa/src/main.tsx` | Mount `<AppVersion />` |
| `apps/pwa/src/pages/system/SettingsPage.tsx` | Add System `SectionCard` with version rows, status chip, check-for-updates button; update right-column stat |

---

## Task 1: vite.config.ts — bake build version and write version.json

**Files:**
- Modify: `apps/pwa/vite.config.ts`

- [ ] **Step 1: Replace the file with the updated config**

Replace the entire `apps/pwa/vite.config.ts` with:

```typescript
import { fileURLToPath, URL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

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
const buildDate = new Date().toISOString().slice(0, 10);
const builtAt = new Date().toISOString();

// Build version: auto-increments on every deploy from base commit count
const BASE_COMMIT = 332; // set on 2026-04-27 — do not change
let commitCount = BASE_COMMIT;
try {
  commitCount = Number(execSync("git rev-list --count HEAD").toString().trim());
} catch {
  // not in a git repo (e.g. CI sandbox) — fall back to base
}
const buildPatch = Math.max(0, commitCount - BASE_COMMIT);
const buildVersion = `1.0.${buildPatch}`;

// Vite plugin: writes public/version.json after each build
function versionManifestPlugin(): Plugin {
  return {
    name: "version-manifest",
    closeBundle() {
      const manifest = JSON.stringify(
        {
          app_version: pkg.version,
          build_version: buildVersion,
          built_at: builtAt,
        },
        null,
        2,
      );
      writeFileSync(
        new URL("./public/version.json", import.meta.url),
        manifest,
        "utf-8",
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_APP_BASE_PATH || "/";

  return {
    base,
    plugins: [react(), versionManifestPlugin()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
      "import.meta.env.VITE_APP_BUILD_DATE": JSON.stringify(buildDate),
      "import.meta.env.VITE_BUILD_VERSION": JSON.stringify(buildVersion),
      "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(builtAt),
      "import.meta.env.VITE_CHANGELOG": JSON.stringify(JSON.stringify(changelog)),
      "import.meta.env.VITE_DOWNLOAD_BASE_URL": JSON.stringify(
        env.VITE_DOWNLOAD_BASE_URL || "/downloads"
      ),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.node.json --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Verify version.json is written on build (dev check)**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx vite build --mode development 2>&1 | tail -5 && cat public/version.json
```

Expected output includes:
```json
{
  "app_version": "1.0.0",
  "build_version": "1.0.0",
  "built_at": "2026-..."
}
```

(`build_version` will be `1.0.0` because `commitCount - BASE_COMMIT = 0` at this exact commit.)

- [ ] **Step 4: Add `public/version.json` to `.gitignore`**

Open `apps/pwa/.gitignore` (or create it if absent). Add:

```
public/version.json
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/vite.config.ts apps/pwa/.gitignore
git commit -m "feat(pwa): bake build version and write version.json at build time"
```

---

## Task 2: AppVersion component — update banner

**Files:**
- Create: `apps/pwa/src/shared/components/AppVersion.tsx`

- [ ] **Step 1: Create the component**

Create `apps/pwa/src/shared/components/AppVersion.tsx`:

```typescript
import { useEffect, useState } from "react";
import { Button } from "@/shared";

type VersionManifest = {
  app_version: string;
  build_version: string;
  built_at: string;
};

const POLL_INTERVAL_MS = 3 * 60 * 1000;

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
        onClick={() => window.location.reload()}
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
git add apps/pwa/src/shared/components/AppVersion.tsx
git commit -m "feat(pwa): add AppVersion update banner component"
```

---

## Task 3: Mount AppVersion in main.tsx

**Files:**
- Modify: `apps/pwa/src/main.tsx`

- [ ] **Step 1: Add import and mount**

The current `apps/pwa/src/main.tsx` render block (lines 81–91) is:

```typescript
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

Add the import at the top of the file (after existing imports):

```typescript
import { AppVersion } from "@/shared/components/AppVersion";
```

Replace the render block with:

```typescript
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    <AppVersion />
  </React.StrictMode>,
);
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "main.tsx" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/main.tsx
git commit -m "feat(pwa): mount AppVersion banner in main.tsx"
```

---

## Task 4: Settings page — System section

**Files:**
- Modify: `apps/pwa/src/pages/system/SettingsPage.tsx`

- [ ] **Step 1: Replace SettingsPage.tsx with the updated version**

Replace the entire file:

```typescript
import { useState } from "react";
import { Button, SectionCard, StatCard, TextField } from "@/shared";
import { changeWorkspacePassword } from "@/shared/api/workspace-api";
import { SystemShellPage } from "./page-helpers";

type CheckStatus = "idle" | "checking" | "up-to-date" | "update-available";

const appVersion = import.meta.env.VITE_APP_VERSION as string;
const buildVersion = import.meta.env.VITE_BUILD_VERSION as string;
const builtAt = import.meta.env.VITE_APP_BUILT_AT as string | undefined;

function formatBuiltAt(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
  const [latestBuild, setLatestBuild] = useState<string | null>(null);

  async function handleChangePassword() {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setNotice("Fill all password fields.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setNotice("New password and confirmation do not match.");
      return;
    }
    try {
      setSaving(true);
      setNotice(null);
      await changeWorkspacePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setNotice("Password updated successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckForUpdates() {
    setCheckStatus("checking");
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const payload = (await res.json()) as { built_at: string; build_version: string };
      if (payload.built_at && payload.built_at !== builtAt) {
        setLatestBuild(payload.build_version ?? null);
        setCheckStatus("update-available");
      } else {
        setCheckStatus("up-to-date");
      }
    } catch {
      setCheckStatus("idle");
    }
  }

  return (
    <SystemShellPage
      activeLabel="Settings"
      breadcrumbs={[
        { label: "Profile", path: "/profile" },
        { label: "Settings" },
      ]}
      eyebrow="Workspace > Settings"
      title="Settings"
      description="Manage security, notifications, and workspace defaults in one place."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title="Notification Preferences" description="This reflects the same preference categories we'll later bind to persistent settings.">
            <div className="grid gap-3">
              {[
                ["In-app notifications", "Receive live alerts inside the workspace."],
                ["Email notifications", "Get important updates in your inbox."],
                ["Approval reminders", "Receive nudges when a request waits on you."],
                ["Attendance reminders", "Get reminders for onsite days and attendance actions."],
              ].map(([label, text]) => (
                <label key={label} className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{label}</span>
                    <span className="mt-1 block text-sm text-slate-500">{text}</span>
                  </span>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900" />
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Security" description="Ported from the existing profile/security flow.">
            {notice ? (
              <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {notice}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
              />
              <div />
              <TextField
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
              />
            </div>
            <Button className="mt-4" onClick={() => void handleChangePassword()} disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </SectionCard>

          <SectionCard title="System" description="Portal version information.">
            <div className="grid gap-3">
              {[
                ["App Version", appVersion],
                ["Build Version", buildVersion],
                ["Built", formatBuiltAt(builtAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                {checkStatus === "up-to-date" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Up to date
                  </span>
                )}
                {checkStatus === "update-available" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {latestBuild ? `Build ${latestBuild} available` : "Update available"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {checkStatus === "update-available" && (
                  <Button size="sm" onClick={() => window.location.reload()}>
                    Reload
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleCheckForUpdates()}
                  disabled={checkStatus === "checking"}
                >
                  {checkStatus === "checking" ? "Checking..." : "Check for updates"}
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <StatCard label="Security" value="Active" tone="success" hint="Password change is now wired to the API." />
          <StatCard label="Portal Build" value={buildVersion} tone="neutral" hint="Auto-increments on every server deploy." />
        </div>
      </div>
    </SystemShellPage>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "SettingsPage" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/system/SettingsPage.tsx
git commit -m "feat(pwa): add System section to Settings with App Version, Build Version, and update check"
```

---

## Manual Verification Checklist

After all tasks complete:

- [ ] Run `npm run build` in `apps/pwa` → confirm `public/version.json` is written with correct `build_version` and `built_at`
- [ ] Navigate to Settings → confirm App Version, Build Version, Built rows appear
- [ ] Click "Check for updates" → if same build, see "Up to date" chip
- [ ] To test the banner: temporarily change `VITE_APP_BUILT_AT` in `vite.config.ts` to a past timestamp, rebuild, serve, and verify the banner appears
- [ ] Confirm banner shows "Build X.X.X is ready" with the correct version from `version.json`
- [ ] Click "Reload now" → page reloads
