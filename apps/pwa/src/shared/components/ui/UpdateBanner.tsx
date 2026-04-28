import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared";

const buildVersion = import.meta.env.VITE_BUILD_VERSION as string;

type BannerStatus = "idle" | "checking" | "available" | "reloading";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function compareBuildVersions(current: string, latest: string): number {
  const a = current.split(".").map(Number);
  const b = latest.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) < (b[i] ?? 0)) return -1;
    if ((a[i] ?? 0) > (b[i] ?? 0)) return 1;
  }
  return 0;
}

export function UpdateBanner() {
  const [status, setStatus] = useState<BannerStatus>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { build_version: string };
        if (compareBuildVersions(buildVersion, payload.build_version) < 0) {
          setLatestVersion(payload.build_version);
          setStatus("available");
        } else {
          setStatus("idle");
        }
      } catch {
        // silently ignore network errors
      }
    }

    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS);

    const handleFocus = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  if (status !== "available") return null;

  function handleReload() {
    setStatus("reloading");
    window.location.reload();
  }

  return (
    <div className="fixed left-0 right-0 top-16 z-50 flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-sm font-medium text-amber-800">
          Build {latestVersion} is available
        </span>
      </div>
      <Button size="sm" onClick={handleReload}>
        Reload
      </Button>
    </div>
  );
}