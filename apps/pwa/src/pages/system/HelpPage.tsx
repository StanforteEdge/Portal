import { Link } from "react-router-dom";
import { Button, Icon, SectionCard } from "@stanforte/shared";
import { SystemShellPage } from "./page-helpers";

export default function HelpPage() {
  return (
    <SystemShellPage
      activeLabel=""
      breadcrumbs={[
        { label: "Workspace", path: "/profile" },
        { label: "Help" },
      ]}
      eyebrow="Workspace > Help"
      title="Help Center"
      description="Find support channels, quick guides, and operational help across the portal."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title="Popular Topics" description="Based on the existing help center structure.">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Finance Help",
                  description: "Understand requests, manual entry, money flow, invoicing, reporting, budgets, and finance setup.",
                  href: "/requests",
                  icon: "payments",
                },
                {
                  title: "Documents and Policies",
                  description: "Use document records for published files and attach them to policies when acknowledgement or version control is required.",
                  href: "/profile",
                  icon: "menu_book",
                },
              ].map((item) => (
                <Link key={item.title} to={item.href} className="rounded-[22px] border border-slate-100 bg-slate-50 p-5 transition hover:border-brand-900/30 hover:bg-white">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-900/10 text-brand-900">
                      <Icon name={item.icon} className="text-[20px]" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SectionCard title="Need human support?">
            <p className="text-sm leading-6 text-slate-600">
              Use the help center for operational guidance. Each major workspace section can later link back here with contextual guides.
            </p>
            <Button className="mt-4 w-full justify-center">Contact Support</Button>
          </SectionCard>
        </div>
      </div>
    </SystemShellPage>
  );
}
