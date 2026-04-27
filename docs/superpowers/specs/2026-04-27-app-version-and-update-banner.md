# App Version & Update Banner

**Date:** 2026-04-27
**Status:** Approved

## Goal

Give every user an automatic update notification when a new version is deployed, and give support staff a readable version display in Settings to quickly identify what build a user is running.

## Background

The old PWA had an `AppVersion` component that polled `/version.json` and showed a "Reload now" prompt. The new PWA has no equivalent. Support cannot confirm which build a staff member is on without asking them to open the browser console.

## Two Independent Versions

| Label | Source | Changes |
|-------|--------|---------|
| **App Version** | `package.json → version` | Manually bumped by a developer for significant releases |
| **Build Version** | `git rev-list --count HEAD − BASE_COMMIT` | Auto-increments on every deploy, zero manual steps |

`BASE_COMMIT` is a constant set once in `vite.config.ts` (today's git commit count). After setup, the first deploy shows `1.0.0`, the next `1.0.1`, and so on.

## Build-time Output

Every `vite build` run writes `apps/pwa/public/version.json`:

```json
{
  "app_version": "1.0.0",
  "build_version": "1.0.47",
  "built_at": "2026-04-27T14:32:00.000Z"
}
```

The same three values are baked into the bundle as `import.meta.env` constants so the app can read them without a network request on load:

- `VITE_APP_VERSION` — already defined in vite.config.ts (from package.json)
- `VITE_BUILD_VERSION` — new, computed from git commit count
- `VITE_APP_BUILT_AT` — new, ISO timestamp of the build

`version.json` is written by a Vite plugin added to `vite.config.ts` using Node's `fs.writeFileSync` in the `closeBundle` hook. Git commit count is read with `execSync('git rev-list --count HEAD')`.

`version.json` is **not committed** to git — it is generated fresh on every build.

## Update Detection

`AppVersion` component (`apps/pwa/src/shared/components/AppVersion.tsx`):

- Mounted globally in `main.tsx`, outside all routes
- In development (`import.meta.env.DEV`): does nothing
- In production: polls `GET /version.json?t={Date.now()}` (cache-busted) every **3 minutes**
- Compares server `built_at` against the app's baked-in `VITE_APP_BUILT_AT`
- When they differ → sets `updateAvailable = true`

When `updateAvailable`:

```
┌─────────────────────────────────┐
│ New version available           │
│ Build 1.0.48 is ready           │
│                    [Reload now] │
└─────────────────────────────────┘
```

Fixed bottom-right, `z-[1100]`. Clicking "Reload now" calls `window.location.reload()`. No rollback, no service worker involvement. The poll stops once `updateAvailable` is true (no need to keep checking).

## Settings Page — System Section

A new `SectionCard title="System"` is appended to the left column (`lg:col-span-8`) of `SettingsPage.tsx`, below the Security card.

Contents:
- **App Version** row — value from `import.meta.env.VITE_APP_VERSION`
- **Build Version** row — value from `import.meta.env.VITE_BUILD_VERSION`
- **Built** row — `import.meta.env.VITE_APP_BUILT_AT` formatted as `27 Apr 2026 14:32`
- **Status chip** — "Up to date" (success) or "Update available" (warning)
- **"Check for updates" button** — triggers a one-off manual poll of `/version.json`; if newer `built_at` found, status chip switches and a "Reload" button appears inline

The right column gets a matching `StatCard label="Portal Build" value={buildVersion}` replacing one of the placeholder stat cards.

## Files Affected

| File | Change |
|------|--------|
| `apps/pwa/vite.config.ts` | Add `VITE_BUILD_VERSION`, `VITE_APP_BUILT_AT` defines; add Vite plugin to write `public/version.json` in `closeBundle` |
| `apps/pwa/src/shared/components/AppVersion.tsx` | New component — polls version.json, shows update banner |
| `apps/pwa/src/main.tsx` | Mount `<AppVersion />` |
| `apps/pwa/src/pages/system/SettingsPage.tsx` | Add System SectionCard with version rows, status chip, check-for-updates button |

## Out of Scope

- Auto-bumping `package.json` version in CI
- Service worker registration or cache management
- Changelog display (already handled by `VITE_CHANGELOG` elsewhere)
- Forcing reload without user consent
