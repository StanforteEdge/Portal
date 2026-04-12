# Native OS Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the portal to the OS via native notifications for approval requests, auto-updater for seamless upgrades, deep linking so external links open specific pages, and a global shortcut to raise the window from anywhere.

**Architecture:** Each integration is a separate Tauri plugin registered in `lib.rs`. The JS side uses `src/lib/tauri-bridge.ts` (created in the native-shell plan) extended with new functions. React components call these functions; all Tauri calls are guarded by `IS_TAURI` so the web build is unaffected.

**Prerequisite:** Complete `2026-04-12-native-shell.md` first — this plan extends `lib.rs` and `tauri-bridge.ts` created there.

**Tech Stack:** `tauri-plugin-notification`, `tauri-plugin-updater`, `tauri-plugin-deep-link`, `tauri-plugin-global-shortcut`, `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-updater`, `@tauri-apps/plugin-deep-link`, `@tauri-apps/plugin-global-shortcut`.

---

## File Map

| File | Action |
|---|---|
| `apps/pwa/src-tauri/Cargo.toml` | Modify — add 4 plugin crates |
| `apps/pwa/src-tauri/src/lib.rs` | Modify — register 4 plugins, add deep-link handler, global shortcut |
| `apps/pwa/src-tauri/tauri.conf.json` | Modify — add deep-link protocol |
| `apps/pwa/src-tauri/capabilities/default.json` | Modify — add plugin permissions |
| `apps/pwa/src/lib/tauri-bridge.ts` | Modify — add `sendNotification`, `checkForUpdates`, `onDeepLink` |
| `apps/pwa/src/features/requests/pages/ApprovalsPage.tsx` | Modify — send notification when new approval arrives |
| `apps/pwa/src/pages/system/DownloadPage.tsx` | Modify — add "Check for updates" button |

---

## Task 1: Add Rust plugin dependencies

**Files:**
- Modify: `apps/pwa/src-tauri/Cargo.toml`

- [ ] **Step 1: Update `Cargo.toml` dependencies**

```toml
[package]
name = "app"
version = "1.0.0"
description = "Stanforte Portal Desktop"
authors = ["Stanforte Edge"]
license = ""
repository = ""
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.5.6", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.10.3", features = ["tray-icon", "image-ico", "image-png"] }
tauri-plugin-log = "2"
tauri-plugin-window-state = "2"
tauri-plugin-notification = "2"
tauri-plugin-updater = "2"
tauri-plugin-deep-link = "2"
tauri-plugin-global-shortcut = "2"
```

- [ ] **Step 2: Fetch dependencies**

```bash
cd apps/pwa/src-tauri && cargo fetch
```

Expected: all 4 new crates resolve and download successfully.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src-tauri/Cargo.toml apps/pwa/src-tauri/Cargo.lock
git commit -m "chore: add notification, updater, deep-link, global-shortcut plugins"
```

---

## Task 2: Add JS plugin packages

**Files:**
- Modify: `apps/pwa/package.json`

- [ ] **Step 1: Install JS bindings**

```bash
cd apps/pwa && npm install @tauri-apps/plugin-notification @tauri-apps/plugin-updater @tauri-apps/plugin-deep-link @tauri-apps/plugin-global-shortcut
```

- [ ] **Step 2: Verify package.json has the 4 new dependencies**

```bash
cd apps/pwa && grep -E "plugin-(notification|updater|deep-link|global-shortcut)" package.json
```

Expected: 4 matching lines.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/package.json apps/pwa/package-lock.json
git commit -m "chore: add JS bindings for native plugin packages"
```

---

## Task 3: Register plugins and global shortcut in lib.rs

**Files:**
- Modify: `apps/pwa/src-tauri/src/lib.rs`

Replace the full contents of `lib.rs` with the version below. This extends the file from the native-shell plan.

- [ ] **Step 1: Replace `apps/pwa/src-tauri/src/lib.rs`**

```rust
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[tauri::command]
fn set_badge_count(app: tauri::AppHandle, count: u32) {
    if let Some(tray) = app.tray_by_id("main") {
        let tooltip = if count > 0 {
            format!("Stanforte Portal ({count} unread)")
        } else {
            "Stanforte Portal".to_string()
        };
        let _ = tray.set_tooltip(Some(&tooltip));
    }

    #[cfg(target_os = "macos")]
    {
        if let Some(dock) = app.dock() {
            let badge = if count > 0 {
                Some(count.to_string())
            } else {
                None
            };
            let _ = dock.set_badge(badge.as_deref());
        }
    }
}

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Stanforte Portal", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open, &separator, &quit])?;

    let icon = Image::from_path("icons/32x32.png").unwrap_or_else(|_| {
        Image::from_bytes(&[]).expect("fallback empty icon")
    });

    TrayIconBuilder::with_id("main")
        .tooltip("Stanforte Portal")
        .icon(icon)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn build_menu_bar(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{AboutMetadata, Submenu};

    let app_menu = Submenu::with_id(app, "app", "Stanforte Portal", true, &[
        &PredefinedMenuItem::about(
            app,
            Some("About Stanforte Portal"),
            Some(AboutMetadata {
                name: Some("Stanforte Portal".into()),
                version: Some(env!("CARGO_PKG_VERSION").into()),
                ..Default::default()
            }),
        )?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::hide(app, Some("Hide"))?,
        &PredefinedMenuItem::hide_others(app, Some("Hide Others"))?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::quit(app, Some("Quit"))?,
    ])?;

    let edit_menu = Submenu::with_id(app, "edit", "Edit", true, &[
        &PredefinedMenuItem::cut(app, Some("Cut"))?,
        &PredefinedMenuItem::copy(app, Some("Copy"))?,
        &PredefinedMenuItem::paste(app, Some("Paste"))?,
        &PredefinedMenuItem::select_all(app, Some("Select All"))?,
    ])?;

    let window_menu = Submenu::with_id(app, "window", "Window", true, &[
        &PredefinedMenuItem::minimize(app, Some("Minimize"))?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::close_window(app, Some("Close"))?,
    ])?;

    let menu = Menu::with_items(app, &[&app_menu, &edit_menu, &window_menu])?;
    app.set_menu(menu)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            build_tray(app)?;

            #[cfg(target_os = "macos")]
            build_menu_bar(app)?;

            // Global shortcut: Cmd+Shift+P (macOS) / Ctrl+Shift+P (Win/Linux) — raise window
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
            let shortcut: Shortcut = "CommandOrControl+Shift+P".parse().expect("valid shortcut");
            let handle = app.handle().clone();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            })?;

            // Deep link handler — emit event to frontend so React Router can navigate
            let handle2 = app.handle().clone();
            app.listen("deep-link://new-url", move |event| {
                if let Some(window) = handle2.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("deep-link", event.payload());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_badge_count])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Build in debug mode to verify it compiles**

```bash
cd apps/pwa && npm run tauri:build -- --debug 2>&1 | grep -E "^error|Finished"
```

Expected: `Finished` line, no `error[E` lines.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src-tauri/src/lib.rs
git commit -m "feat: register notification, updater, deep-link, global-shortcut plugins"
```

---

## Task 4: Update capabilities and tauri.conf.json

**Files:**
- Modify: `apps/pwa/src-tauri/capabilities/default.json`
- Modify: `apps/pwa/src-tauri/tauri.conf.json`

- [ ] **Step 1: Update `capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:tray:default",
    "core:tray:allow-set-icon",
    "core:tray:allow-set-tooltip",
    "core:tray:allow-set-title",
    "notification:default",
    "notification:allow-request-permission",
    "notification:allow-is-permission-granted",
    "notification:allow-send-notification",
    "updater:default",
    "updater:allow-check",
    "updater:allow-download-and-install",
    "deep-link:default",
    "global-shortcut:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

- [ ] **Step 2: Add deep-link protocol to `tauri.conf.json`**

In `apps/pwa/src-tauri/tauri.conf.json`, add a `"plugins"` key after `"bundle"`:

```json
{
  "$schema": "../../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "Stanforte Portal",
  "version": "1.0.0",
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
  },
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["stanforte"]
      }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src-tauri/capabilities/default.json apps/pwa/src-tauri/tauri.conf.json
git commit -m "feat: add capabilities for all native plugins, register stanforte:// deep link scheme"
```

---

## Task 5: Extend tauri-bridge.ts

**Files:**
- Modify: `apps/pwa/src/lib/tauri-bridge.ts`

- [ ] **Step 1: Replace `apps/pwa/src/lib/tauri-bridge.ts`**

```ts
// Thin wrapper around Tauri APIs. All functions no-op when running in browser.
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function setBadgeCount(count: number): Promise<void> {
  if (!IS_TAURI) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("set_badge_count", { count });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!IS_TAURI) return false;
  const { isPermissionGranted, requestPermission } = await import(
    "@tauri-apps/plugin-notification"
  );
  if (await isPermissionGranted()) return true;
  const permission = await requestPermission();
  return permission === "granted";
}

export async function sendNativeNotification(
  title: string,
  body: string,
  url?: string
): Promise<void> {
  if (!IS_TAURI) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const { sendNotification } = await import("@tauri-apps/plugin-notification");
  sendNotification({ title, body, ...(url ? { actionTypeId: url } : {}) });
}

export async function checkForUpdates(): Promise<void> {
  if (!IS_TAURI) return;
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();
  if (!update?.available) {
    return;
  }
  const confirmed = window.confirm(
    `Update ${update.version} is available.\n\n${update.body ?? ""}\n\nInstall now?`
  );
  if (confirmed) {
    await update.downloadAndInstall();
  }
}

export function onDeepLink(callback: (url: string) => void): () => void {
  if (!IS_TAURI) return () => {};
  let unlisten: (() => void) | undefined;
  import("@tauri-apps/api/event").then(({ listen }) => {
    listen<string>("deep-link", (event) => {
      callback(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });
  });
  return () => unlisten?.();
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/lib/tauri-bridge.ts
git commit -m "feat: extend tauri-bridge with notifications, updater, deep-link"
```

---

## Task 6: Send native notification on new approval request

**Files:**
- Modify: `apps/pwa/src/features/requests/pages/ApprovalsPage.tsx`

When the approvals list loads and has items, send one native notification summarising pending count. Use a `useRef` to only fire once per session (not on every re-render).

- [ ] **Step 1: Add notification dispatch to `ApprovalsPage.tsx`**

Add this import near the top of the file:

```ts
import { sendNativeNotification } from "@/lib/tauri-bridge";
```

Add this hook inside the `ApprovalsPage` component, after the existing data-fetching hooks:

```tsx
const notifiedRef = useRef(false);
useEffect(() => {
  if (notifiedRef.current) return;
  const pending = apiRows.filter((r) => r.status === "pending");
  if (pending.length === 0) return;
  notifiedRef.current = true;
  void sendNativeNotification(
    "Approvals Pending",
    `You have ${pending.length} request${pending.length === 1 ? "" : "s"} awaiting approval.`,
    "/requests/approvals"
  );
}, [apiRows]);
```

Make sure `useRef` is imported from React (it should already be).

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/features/requests/pages/ApprovalsPage.tsx
git commit -m "feat: send native notification when approval requests are pending"
```

---

## Task 7: "Check for updates" button on DownloadPage

**Files:**
- Modify: `apps/pwa/src/pages/system/DownloadPage.tsx`

- [ ] **Step 1: Add import**

```ts
import { checkForUpdates } from "@/lib/tauri-bridge";
```

- [ ] **Step 2: Add the button inside the `SectionCard` for "Desktop App", after the platform grid**

Add this after the closing `</div>` of the platforms grid:

```tsx
<div className="mt-4 border-t border-slate-100 pt-4">
  <button
    type="button"
    onClick={() => void checkForUpdates()}
    className="flex items-center gap-2 text-sm font-semibold text-brand-900 hover:underline"
  >
    <Icon name="system_update" className="text-[18px]" />
    Check for updates
  </button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/system/DownloadPage.tsx
git commit -m "feat: check for updates button on download page"
```

---

## Task 8: Deep-link navigation in React

**Files:**
- Modify: `apps/pwa/src/App.tsx`

When a `stanforte://` deep link arrives (e.g. `stanforte://requests/approvals`), the app navigates to the matching route.

- [ ] **Step 1: Add deep-link listener to `App.tsx`**

Add this import:

```ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onDeepLink } from "@/lib/tauri-bridge";
```

Add this hook inside the `App` component, before the `return`:

```tsx
const navigate = useNavigate();
useEffect(() => {
  const unlisten = onDeepLink((url) => {
    // url is e.g. "stanforte://requests/approvals"
    try {
      const path = new URL(url).pathname || "/";
      navigate(path);
    } catch {
      // ignore malformed URLs
    }
  });
  return unlisten;
}, [navigate]);
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat: deep-link navigation routes stanforte:// URLs to React Router"
```

---

## Done

Manual verification checklist in `npm run tauri:dev`:
- [ ] `Ctrl/Cmd+Shift+P` raises the window when it is behind other apps
- [ ] Navigating to `/requests/approvals` with pending items triggers a macOS/Windows notification
- [ ] Clicking "Check for updates" on `/download` shows "up to date" (or triggers install if a newer version exists in updater endpoint)
- [ ] Opening `stanforte://requests/approvals` from Terminal (`open "stanforte://requests/approvals"`) navigates the app to that page
- [ ] Badge count on dock icon reflects unread notification count from TopBar
