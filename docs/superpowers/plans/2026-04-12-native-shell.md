# Native Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop app feel native by adding a system tray, native menu bar, window state persistence, and a dock badge that reflects unread notification count.

**Architecture:** All native features are wired in Rust (`lib.rs`). A single Tauri command `set_badge_count` is exposed so the React app can push the unread count into the OS badge and tray tooltip. The JS side uses a thin `src/lib/tauri-bridge.ts` utility that no-ops when running in the browser.

**Tech Stack:** Tauri 2.x, `tauri-plugin-window-state`, Rust menu/tray APIs (built into `tauri` crate), `@tauri-apps/api` invoke.

---

## File Map

| File | Action |
|---|---|
| `apps/pwa/src-tauri/Cargo.toml` | Modify — add `tauri-plugin-window-state`, enable `tray-icon` feature |
| `apps/pwa/src-tauri/src/lib.rs` | Modify — wire tray, menu bar, window state, badge command |
| `apps/pwa/src-tauri/capabilities/default.json` | Modify — add tray permissions |
| `apps/pwa/src/lib/tauri-bridge.ts` | Create — thin JS wrapper for `set_badge_count` |
| `apps/pwa/src/shared/context/AuthProvider.tsx` | Read only — understand where unread count lives |
| `apps/pwa/src/shared/components/layout/TopBar.tsx` | Modify — call `setBadgeCount` when unread count changes |

---

## Task 1: Add Rust dependencies and Tauri features

**Files:**
- Modify: `apps/pwa/src-tauri/Cargo.toml`

- [ ] **Step 1: Update `Cargo.toml`**

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
```

- [ ] **Step 2: Fetch dependencies**

```bash
cd apps/pwa/src-tauri && cargo fetch
```

Expected: dependencies download with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src-tauri/Cargo.toml apps/pwa/src-tauri/Cargo.lock
git commit -m "chore: add window-state plugin, enable tray-icon feature"
```

---

## Task 2: System tray

**Files:**
- Modify: `apps/pwa/src-tauri/src/lib.rs`
- Modify: `apps/pwa/src-tauri/capabilities/default.json`

The tray shows a context menu with: **Open**, separator, **Quit**. Left-clicking the tray icon shows and focuses the main window. The tooltip shows "Stanforte Portal".

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
    "core:tray:allow-set-title"
  ]
}
```

- [ ] **Step 2: Replace `apps/pwa/src-tauri/src/lib.rs`**

```rust
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[tauri::command]
fn set_badge_count(app: tauri::AppHandle, count: u32) {
    // Update tray tooltip to reflect unread count
    if let Some(tray) = app.tray_by_id("main") {
        let tooltip = if count > 0 {
            format!("Stanforte Portal ({count} unread)")
        } else {
            "Stanforte Portal".to_string()
        };
        let _ = tray.set_tooltip(Some(&tooltip));
    }

    // macOS dock badge
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_badge_count])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Build to verify it compiles**

```bash
cd apps/pwa && npm run tauri:build -- --debug 2>&1 | grep -E "error|warning|Finished"
```

Expected: `Finished` with no `error[E...]` lines. Warnings about unused imports are acceptable.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src-tauri/src/lib.rs apps/pwa/src-tauri/capabilities/default.json
git commit -m "feat: system tray, native menu bar, window state, dock badge command"
```

---

## Task 3: JS bridge for badge count

**Files:**
- Create: `apps/pwa/src/lib/tauri-bridge.ts`
- Modify: `apps/pwa/src/shared/components/layout/TopBar.tsx`

- [ ] **Step 1: Create `apps/pwa/src/lib/tauri-bridge.ts`**

```ts
// Thin wrapper around Tauri commands. No-ops when running in browser.
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function setBadgeCount(count: number): Promise<void> {
  if (!IS_TAURI) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("set_badge_count", { count });
}
```

- [ ] **Step 2: Call `setBadgeCount` when unread count changes in `DesktopTopBar`**

In `apps/pwa/src/shared/components/layout/TopBar.tsx`, add this import at the top:

```ts
import { setBadgeCount } from "@/lib/tauri-bridge";
```

Add a `useEffect` inside `DesktopTopBar`, immediately after the existing `useEffect` that handles click-outside:

```tsx
useEffect(() => {
  void setBadgeCount(unreadCount);
}, [unreadCount]);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/lib/tauri-bridge.ts apps/pwa/src/shared/components/layout/TopBar.tsx
git commit -m "feat: JS bridge wires unread count to dock badge and tray tooltip"
```

---

## Done

Manual verification in the desktop app (`npm run tauri:dev`):
- Tray icon appears in menu bar (macOS) / system tray (Windows/Linux)
- Left-clicking tray shows the window
- Right-clicking shows Open / Quit menu
- macOS app menu shows About, Hide, Quit with correct shortcuts
- Edit menu enables cut/copy/paste in text fields
- Window size and position are restored after restart
- When notification count > 0, dock badge shows the count and tray tooltip says "Stanforte Portal (N unread)"
