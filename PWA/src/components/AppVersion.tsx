import { useEffect, useMemo, useState } from "react";

type VersionManifest = {
  version?: string;
  commit?: string;
  built_at?: string;
};

const VERSION_CHECK_INTERVAL_MS = 3 * 60 * 1000;

function AppVersion() {
  const currentVersion = import.meta.env.VITE_APP_VERSION || "dev";
  const currentCommit = (import.meta.env.VITE_APP_COMMIT_SHA || "").slice(0, 7);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const label = useMemo(() => {
    return currentCommit ? `v${currentVersion} (${currentCommit})` : `v${currentVersion}`;
  }, [currentVersion, currentCommit]);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    let timer: number | undefined;
    const checkLatestVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as VersionManifest;
        const latestVersion = payload.version || "";
        const latestCommit = (payload.commit || "").slice(0, 7);

        if (
          (latestVersion && latestVersion !== currentVersion) ||
          (latestCommit && latestCommit !== currentCommit)
        ) {
          setUpdateAvailable(true);
        }
      } catch {
        // ignore periodic version check failures
      }
    };

    void checkLatestVersion();
    timer = window.setInterval(() => {
      void checkLatestVersion();
    }, VERSION_CHECK_INTERVAL_MS);

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [currentVersion, currentCommit]);

  if (updateAvailable) {
    return (
      <div className="fixed bottom-3 right-3 z-[1100] rounded-md border border-primary/30 bg-white px-3 py-2 text-xs shadow-md dark:bg-darkmode-800">
        <div className="font-medium text-slate-700 dark:text-slate-200">New version available</div>
        <button
          className="mt-1 text-primary hover:underline"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reload now
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-[1000] rounded bg-slate-900/80 px-2 py-1 text-[10px] text-white">
      {label}
    </div>
  );
}

export default AppVersion;
