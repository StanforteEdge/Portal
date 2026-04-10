import { Link } from "react-router-dom";
import AppNotice from "@/components/AppNotice";

function NewPortalNotice() {
  return (
    <div className="mb-6 rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
      <AppNotice
        tone="info"
        message="A newer staff portal experience is available. You can continue here, but we recommend using the new portal for requests and attendance."
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          to="/app"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Open New Portal
        </Link>
        <span className="text-sm text-slate-500">
          Recommended for the refreshed requests and attendance workflows.
        </span>
      </div>
    </div>
  );
}

export default NewPortalNotice;
