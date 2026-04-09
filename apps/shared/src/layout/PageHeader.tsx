import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

type PageHeaderProps = {
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  breadcrumbs,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {breadcrumbs ? (
          <div className="mb-2">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : eyebrow ? (
          <p className="section-kicker mb-2">{eyebrow}</p>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
