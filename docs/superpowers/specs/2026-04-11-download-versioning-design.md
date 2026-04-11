# Download Page & Versioning System — Design Spec

## Overview

Add a desktop app download section to the Stanforte Portal web app. This includes a download icon in the top bar, a dedicated `/download` page with changelog, and a build-time versioning system that uses `package.json` as the single source of truth.

---

## 1. TopBar Icon

**Placement:** Desktop TopBar only (`DesktopTopBar` component), between the notifications icon and the profile button.

**Implementation:** A `NavLink` to `/download` rendered as an icon button using the existing `iconButtonClass(active)` helper. Active state is triggered when `location.pathname === "/download"`. Uses Material Symbol icon `download`.

**Update badge:** A small green dot (same visual pattern as the unread notifications dot) appears on the icon when the running app version (`import.meta.env.VITE_APP_VERSION`) is older than a hard-coded latest version constant in the version config file. This allows future builds to advertise themselves without requiring a backend.

**Mobile:** Not added to `MobileTopBar` — the download page is a desktop-app distribution concern. Mobile users access the PWA directly.

---

## 2. Download Page (`/download`)

**Route:** `/download` added to the app router.

**Page layout:**
- Page title: "Download Stanforte Portal"
- Subtitle: "Get the native desktop app for a faster, offline-capable experience"
- Version badge: shows current version + release date (from build-time env vars)
- Download buttons: macOS (Apple Silicon `.dmg`), macOS (Intel `.dmg`), Windows (`.exe`), Linux (`.AppImage`)
- Changelog section: rendered list of releases — each entry shows version number, date, and bullet-point changes

**Download links:** For now, links point to GitHub Releases on the `edgdmedia/rhema`-style repo (placeholder URLs configurable via `VITE_DOWNLOAD_BASE_URL` env var). When a release is not yet published for a platform, the button is shown as disabled with a "Coming soon" tooltip.

**Changelog data source:** Parsed from `CHANGELOG.md` at build time by a Vite plugin (`vite-plugin-changelog`) and injected as `import.meta.env.VITE_CHANGELOG` (a JSON string). The page component parses and renders this data — no runtime fetch needed.

---

## 3. Versioning System

### Source of truth
`apps/pwa/package.json` `"version"` field. This is the canonical version for the web/desktop app.

Tauri reads its version from `tauri.conf.json`, which is kept in sync manually or via a `prebuild` npm script that writes `"version"` from `package.json` into `tauri.conf.json`.

### Version format
Semantic versioning: `MAJOR.MINOR.PATCH`
- `PATCH` — bug fixes, small improvements
- `MINOR` — new features (e.g., new page, new column)
- `MAJOR` — breaking changes or major redesigns

### Vite env injection
`vite.config.ts` reads `package.json` version and injects two env vars:
- `VITE_APP_VERSION` — e.g. `"1.2.0"`
- `VITE_APP_BUILD_DATE` — ISO date string of the build (set from `new Date().toISOString()` at config evaluation time)

### Changelog format
`CHANGELOG.md` at `apps/pwa/CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.0] — 2026-04-11
### Added
- Download page with version history and platform download buttons
- Download icon in desktop top bar

### Fixed
- WebKit ATS issue with localhost API on macOS

## [1.1.0] — 2026-03-28
### Added
- Approvals page: Category, Team, Due Date columns
- Requests list: team name resolution from profile
```

### Vite plugin (`vite-plugin-changelog`)
A small inline Vite plugin (defined directly in `vite.config.ts`, not a separate npm package) that:
1. Reads `CHANGELOG.md` at build time
2. Parses it into a JSON array: `[{ version, date, sections: { Added: [], Fixed: [], Changed: [] } }]`
3. Injects it as `import.meta.env.VITE_CHANGELOG` (JSON string)

### Release workflow (manual, for now)
1. Update `"version"` in `apps/pwa/package.json`
2. Add entry to `apps/pwa/CHANGELOG.md`
3. Run `npm run tauri:build` — produces signed/unsigned `.dmg` / `.exe` / `.AppImage`
4. Upload artifacts to GitHub Releases with the version tag
5. Update `VITE_DOWNLOAD_BASE_URL` env var if needed

---

## 4. Files to Create / Modify

| File | Action | Purpose |
|---|---|---|
| `apps/pwa/CHANGELOG.md` | Create | Version history in Keep-a-Changelog format |
| `apps/pwa/vite.config.ts` | Modify | Inject `VITE_APP_VERSION`, `VITE_APP_BUILD_DATE`, `VITE_CHANGELOG` |
| `apps/pwa/src/app/router.tsx` | Modify | Add `/download` route |
| `apps/pwa/src/features/download/pages/DownloadPage.tsx` | Create | Download page component |
| `apps/pwa/src/shared/components/layout/TopBar.tsx` | Modify | Add download icon button to `DesktopTopBar` |

---

## 5. Out of Scope

- Automatic update checks via a backend API (Option 2 deferred)
- Code signing for Windows/Linux builds
- Auto-update via Tauri's updater plugin
- Mobile download page
