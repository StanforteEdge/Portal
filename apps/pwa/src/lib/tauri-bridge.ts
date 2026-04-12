// Thin wrapper around Tauri APIs. All functions no-op when running in browser.
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function setBadgeCount(count: number): Promise<void> {
  if (!IS_TAURI) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("set_badge_count", { count });
}
