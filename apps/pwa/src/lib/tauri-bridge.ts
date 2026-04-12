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
): Promise<void> {
  if (!IS_TAURI) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const { sendNotification } = await import("@tauri-apps/plugin-notification");
  sendNotification({ title, body });
}

export async function checkForUpdates(): Promise<void> {
  if (!IS_TAURI) return;
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();
  if (!update?.available) {
    alert("You're on the latest version.");
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
