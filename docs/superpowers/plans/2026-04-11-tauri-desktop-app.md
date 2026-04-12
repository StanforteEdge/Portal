# Tauri Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing `apps/pwa` Vite + React frontend into a Tauri 2.x desktop app that runs natively on macOS, Windows, and Linux.

**Architecture:** Tauri is scaffolded directly inside `apps/pwa/` — the `src-tauri/` directory sits alongside `src/`. In dev mode, Tauri's webview connects to the existing Vite dev server (`localhost:5173`). In production, Tauri bundles the `vite build` output. The Rust shell is minimal: just window management and the Tauri runtime — no custom Rust commands needed for the initial release. Pattern validated against the Rhema project which uses identical Tauri 2.x structure.

**Tech Stack:** Tauri 2.10.x, `tauri-build` 2.5.x, Rust ≥ 1.77, `@tauri-apps/cli` ^2 (devDep), `@tauri-apps/api` ^2, Vite 5, TypeScript, React 18

---

## Prerequisites (do once, manually)

```bash
# macOS: install Rust via rustup (skip if already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# macOS: Xcode Command Line Tools (skip if already installed)
xcode-select --install

# Verify Rust
rustc --version   # must be >= 1.77
```

`@tauri-apps/cli` is installed as a devDependency in Task 3 — no global cargo install needed.

---

## File Structure

```
apps/pwa/
├── src/                          # existing React app (unchanged)
├── src-tauri/                    # ALREADY EXISTS — verify in Task 1
│   ├── Cargo.toml                # MODIFIED — pin exact Tauri 2.10.x versions (Task 1)
│   ├── Cargo.lock                # generated
│   ├── build.rs                  # unchanged (generated)
│   ├── icons/                    # MODIFIED — generate from brand logo (Task 2)
│   ├── capabilities/             # NEW — Tauri 2 permissions (Task 4)
│   │   ├── default.json
│   │   └── desktop.json
│   └── src/
│       ├── main.rs               # unchanged (minimal entry point)
│       └── lib.rs                # Tauri builder + plugin registration
├── tauri.conf.json               # MODIFIED — correct values (Task 2)
├── vite.config.ts                # MODIFIED — lock port to 5173 (Task 5)
└── package.json                  # MODIFIED — add @tauri-apps/cli, scripts (Task 3)

Root:
└── package.json                  # MODIFIED — add workspace tauri scripts (Task 3)
```

---

### Task 1: Verify the existing scaffold

`apps/pwa/src-tauri/` already exists. This task confirms it's in a clean, compilable state before any changes.

**Files:**
- Read: `apps/pwa/src-tauri/Cargo.toml`
- Read: `apps/pwa/src-tauri/src/main.rs`

- [ ] **Step 1: Check scaffold files exist**

```bash
ls apps/pwa/src-tauri/
```

Expected: `build.rs  Cargo.toml  icons/  src/  tauri.conf.json` — at minimum.

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/pwa
npx @tauri-apps/cli info
```

Expected: Rust version, Tauri version, target platform listed — no errors. If `tauri info` fails, run `cargo check` from `apps/pwa/src-tauri/` to see the Rust error.

- [ ] **Step 3: Confirm main.rs is the minimal pattern**

`apps/pwa/src-tauri/src/main.rs` should contain exactly:

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

If `lib.rs` doesn't exist yet, create `apps/pwa/src-tauri/src/lib.rs`:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

And update `apps/pwa/src-tauri/Cargo.toml` to add the lib target:

```toml
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

- [ ] **Step 4: Commit if any changes were needed**

```bash
git add apps/pwa/src-tauri/src/
git commit -m "fix: ensure tauri lib.rs entry point matches expected pattern"
```

---

### Task 2: Configure tauri.conf.json and icons

**Files:**
- Modify: `apps/pwa/src-tauri/tauri.conf.json`
- Modify: `apps/pwa/src-tauri/icons/` (regenerate)

- [ ] **Step 1: Replace tauri.conf.json**

Write the entire file as:

```json
{
  "$schema": "../../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "Stanforte Portal",
  "version": "0.1.0",
  "identifier": "com.stanforteedge.portal",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Stanforte Portal",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Key differences from a default scaffold:
- `$schema` uses the local `node_modules` path (works offline + IDE autocomplete)
- `frontendDist` is `"../dist"` — Vite's default output directory
- `devUrl` matches Vite's default port `5173`
- `csp: null` allows the webview to reach the remote API without strict header rules

- [ ] **Step 2: Generate icons from brand logo**

Find the brand logo PNG (must be ≥ 512×512):

```bash
ls "apps/shared/assets/brand/"
```

Generate all icon sizes:

```bash
cd apps/pwa
npx @tauri-apps/cli icon "../shared/assets/brand/Stanforteedge Identity_Stanforteedge Icon.png"
```

This writes `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico` into `src-tauri/icons/`.

If the brand PNG is smaller than 512×512, use any larger placeholder for now and re-run when the final asset is ready.

- [ ] **Step 3: Verify config is valid**

```bash
cd apps/pwa
npx @tauri-apps/cli info
```

Expected: no config schema errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src-tauri/tauri.conf.json apps/pwa/src-tauri/icons/
git commit -m "feat: configure tauri window, bundle targets, and brand icons"
```

---

### Task 3: Install @tauri-apps/cli + @tauri-apps/api and add npm scripts

**Files:**
- Modify: `apps/pwa/package.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Install Tauri npm packages**

```bash
cd apps/pwa
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api
```

After install, `apps/pwa/package.json` should have:
```json
"dependencies": {
  "@tauri-apps/api": "^2.x.x",
  ...
},
"devDependencies": {
  "@tauri-apps/cli": "^2.x.x",
  ...
}
```

- [ ] **Step 2: Add tauri scripts to apps/pwa/package.json**

In the `scripts` block add:
```json
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build"
```

Full `scripts` block after edit:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "tauri": "tauri",
  "tauri:dev": "tauri dev",
  "tauri:build": "tauri build"
}
```

- [ ] **Step 3: Add workspace-level tauri scripts to root package.json**

In root `package.json` `scripts`, add:
```json
"tauri:dev": "npm run tauri:dev -w apps/pwa",
"tauri:build": "npm run tauri:build -w apps/pwa"
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/package.json package.json package-lock.json
git commit -m "feat: install @tauri-apps/cli and api, add tauri npm scripts"
```

---

### Task 4: Add Tauri 2 capabilities files

Tauri 2.x uses a capabilities/permissions system instead of the old `allowlist`. Without at least a `default.json` capability, the app will throw permission errors at runtime.

**Files:**
- Create: `apps/pwa/src-tauri/capabilities/default.json`
- Create: `apps/pwa/src-tauri/capabilities/desktop.json`

- [ ] **Step 1: Create capabilities/default.json**

```bash
mkdir -p apps/pwa/src-tauri/capabilities
```

Write `apps/pwa/src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the Stanforte Portal desktop app",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

- [ ] **Step 2: Create capabilities/desktop.json**

Write `apps/pwa/src-tauri/capabilities/desktop.json`:

```json
{
  "identifier": "desktop-capability",
  "description": "Desktop-only capabilities",
  "platforms": ["macOS", "windows", "linux"],
  "windows": ["main"],
  "permissions": []
}
```

The `permissions` array in `desktop.json` starts empty. Add entries here as native features are added (e.g., `"global-shortcut:default"` for keyboard shortcuts, `"notification:default"` for native notifications).

- [ ] **Step 3: Verify schemas are generated**

```bash
cd apps/pwa
npx @tauri-apps/cli build --no-bundle 2>&1 | head -30
```

On first run, Tauri generates `src-tauri/gen/schemas/`. If the `$schema` path in `default.json` is wrong after generation, update it to match the actual path in `gen/schemas/`.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src-tauri/capabilities/
git commit -m "feat: add tauri 2 capabilities and permissions"
```

---

### Task 5: Lock Vite dev server port

Tauri's `beforeDevCommand` expects the dev server on a known port. Add `strictPort: true` so Vite fails fast if 5173 is already in use (rather than silently moving to 5174, causing Tauri's webview to show a blank page).

**Files:**
- Modify: `apps/pwa/vite.config.ts`

- [ ] **Step 1: Add server config to vite.config.ts**

Current file:
```ts
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

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
  };
});
```

Replace with:
```ts
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

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
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
```

- [ ] **Step 2: Verify web build still works**

```bash
cd apps/pwa
npm run build
```

Expected: `dist/` produced, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/vite.config.ts
git commit -m "feat: lock vite dev server to port 5173 for tauri compatibility"
```

---

### Task 6: First dev run — smoke test

- [ ] **Step 1: Launch desktop app in dev mode**

From the repo root:
```bash
npm run tauri:dev
```

Expected: Rust compiles (first run takes 2–5 min), then a native window opens showing the Stanforte Portal login page. Vite HMR works — editing a React file hot-reloads inside the window.

- [ ] **Step 2: Open DevTools if needed**

```bash
# macOS: right-click inside the window → "Inspect Element"
# Or launch with devtools flag:
cd apps/pwa && npx tauri dev -- --open-devtools
```

- [ ] **Step 3: Verify login works**

Log in via the desktop window. API calls should reach the same server as the browser app (Tauri dev uses `http://localhost:5173`, same origin as the browser PWA).

If fetch fails with CORS errors, check the API server's `ALLOWED_ORIGINS` config — add `http://localhost:5173` if not already present.

- [ ] **Step 4: Commit smoke test confirmation**

```bash
git commit --allow-empty -m "chore: tauri dev smoke test passed — login and navigation confirmed"
```

---

### Task 7: Production build and package

- [ ] **Step 1: Run production build**

```bash
npm run tauri:build
```

Expected output sequence:
1. Runs `npm run build` in `apps/pwa` → produces `dist/`
2. Compiles Rust release binary
3. Produces platform installer in `apps/pwa/src-tauri/target/release/bundle/`

macOS output: `bundle/macos/Stanforte Portal.app` + `bundle/dmg/*.dmg`
Windows output: `bundle/nsis/*.exe`
Linux output: `bundle/appimage/*.AppImage` + `bundle/deb/*.deb`

- [ ] **Step 2: Launch the packaged app**

macOS:
```bash
open "apps/pwa/src-tauri/target/release/bundle/macos/Stanforte Portal.app"
```

Verify: app launches, login works, all routes navigate correctly.

- [ ] **Step 3: Ensure target/ is gitignored**

```bash
cat .gitignore | grep src-tauri/target
```

If not present:
```bash
echo "apps/pwa/src-tauri/target/" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore tauri rust build artifacts"
```

---

## Out of Scope (future plans)

These are NOT in this plan — create separate plans when needed:

- **Auto-updater** — requires a release server endpoint + code signing
- **System tray** — `tauri-plugin-system-tray`
- **Native notifications** — `tauri-plugin-notification`
- **Deep links / custom protocol** — `stanforte://` URL scheme
- **Code signing** — macOS notarization, Windows Authenticode
- **CI/CD matrix builds** — GitHub Actions for macOS + Windows + Linux
- **Offline mode** — local data cache / service worker

---

## Self-Review

**Spec coverage:**
- ✅ Rust + Tauri 2.x scaffold verified against working Rhema reference
- ✅ `tauri.conf.json` — correct schema, window, bundle, CSP null
- ✅ Capabilities files — Tauri 2 permissions system (was missing in v1)
- ✅ `@tauri-apps/cli` as devDep (no global cargo install required)
- ✅ `@tauri-apps/api` installed
- ✅ Vite port locked to 5173 with `strictPort`
- ✅ npm scripts wired at both workspace and root level
- ✅ Dev smoke test + production build tasks

**Placeholder scan:** None found.

**Type consistency:** No shared types between tasks.

**Compared against:** Rhema project (`/Users/olalekan/Projects/rhema/`) — identical Tauri 2.10.x setup confirmed working.
