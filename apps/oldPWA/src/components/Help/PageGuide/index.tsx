import { Link } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import { financeHelpMap } from "@/content/help/finance";

type PageGuideProps = {
  pageKey: string;
  className?: string;
};

function PageGuide({ pageKey, className }: PageGuideProps) {
  const entry = financeHelpMap.get(pageKey);
  if (!entry) return null;

  return (
    <div className={["mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <Lucide icon="HelpCircle" className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium">How to use this page</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
        </div>
        <Link to={`/appOld/help/finance#${entry.key}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Open finance guide
          <Lucide icon="ChevronRight" className="h-4 w-4" />
        </Link>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {entry.actions.slice(0, 3).map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      {entry.tips?.length ? (
        <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Tip:</span> {entry.tips[0]}
        </div>
      ) : null}
    </div>
  );
}

export default PageGuide;
