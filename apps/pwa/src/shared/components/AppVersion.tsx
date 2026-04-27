import { useEffect, useState } from "react";
import { Button } from "@/shared";

type VersionManifest = {
  app_version: string;
  build_version: string;
  built_at: string;
};

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const RELOAD_FLAG = "se_version_reload";

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

    const justReloaded = sessionStorage.getItem(RELOAD_FLAG);
    if (justReloaded) {
      sessionStorage.removeItem(RELOAD_FLAG);
      const timer = window.setTimeout(() => void checkVersion(), 10_000);
      const interval = window.setInterval(() => void checkVersion(), POLL_INTERVAL_MS);
      return () => {
        window.clearTimeout(timer);
        window.clearInterval(interval);
      };
    }

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
        onClick={() => {
          sessionStorage.setItem(RELOAD_FLAG, newBuildVersion ?? "pending");
          window.location.reload();
        }}
      >
        Reload now
      </Button>
    </div>
  );
}