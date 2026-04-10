import { Link } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";

const helpSections = [
  {
    title: "Finance Help",
    description: "Understand requests, manual entry, money flow, invoicing, reporting, budgets, and finance setup.",
    href: "/appOld/help/finance",
    icon: "Wallet",
  },
  {
    title: "Documents and Policies",
    description: "Use document records for published files and attach them to policies when acknowledgement or version control is required.",
    href: "/appOld/admin/policies",
    icon: "BookOpen",
  },
];

function HelpHomePage() {
  return (
    <>
      <div className="mt-8 intro-y flex items-center">
        <h2 className="mr-auto text-lg font-medium">Help Center</h2>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Use the help center for operational guidance. Each finance page also includes a short page guide that links back here.
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {helpSections.map((section) => (
          <Link key={section.title} to={section.href} className="box p-5 transition hover:border-primary hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Lucide icon={section.icon as any} className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-slate-800">{section.title}</div>
                <div className="mt-2 text-sm text-slate-500">{section.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default HelpHomePage;
