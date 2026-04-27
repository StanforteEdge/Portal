import { useEffect, useState } from "react";
import { Button } from "@/shared";

type VersionManifest = {
  app_version: string;
  build_version: string;
  built_at: string;
};

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const RELOAD_FLAG = "se_version_reload";

function toComparableBuildVersion(value: string | null | undefined): number[] | null {
  const normalized = String(value ?? "").trim();
  if (!normalized || !/^\d+(?:\.\d+)*$/.test(normalized)) {
    return null;
  }
  return normalized.split(".").map((part) => Number(part));
}

function compareBuildVersions(current: string | null | undefined, latest: string | null | undefined): number {
  const currentParts = toComparableBuildVersion(current);
  const latestParts = toComparableBuildVersion(latest);
  if (!currentParts || !latestParts) return 0;
  const maxLength = Math.max(currentParts.length, latestParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const currentValue = currentParts[index] ?? 0;
    const latestValue = latestParts[index] ?? 0;
    if (latestValue > currentValue) return 1;
    if (latestValue < currentValue) return -1;
  }
  return 0;
}

export function AppVersion() {
  const buildVersion = import.meta.env.VITE_BUILD_VERSION as string | undefined;
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
      const versionComparison = compareBuildVersions(buildVersion, payload.build_version);
      const hasNewerBuild = versionComparison > 0;
      const shouldUseBuiltAtFallback = versionComparison === 0 && !toComparableBuildVersion(buildVersion);
      const hasNewerBuiltAt = Boolean(
        shouldUseBuiltAtFallback &&
        payload.built_at &&
        builtAt &&
        payload.built_at !== builtAt
      );

      if (hasNewerBuild || hasNewerBuiltAt) {
        setNewBuildVersion(payload.build_version ?? null);
        setUpdateAvailable(true);
      } else {
        setNewBuildVersion(null);
        setUpdateAvailable(false);
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
