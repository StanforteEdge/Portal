import { Chip } from "./Chip";
import { Icon } from "./Icon";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "success" | "warning" | "pending" | "danger";
  hint?: string;
  icon?: string;
};

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  hint,
  icon,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {delta ? <Chip variant={tone}>{delta}</Chip> : null}
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-900/8 text-brand-900">
              <Icon name={icon} className="text-[18px]" />
            </span>
          ) : null}
        </div>
      </div>
      {hint ? <p className="field-help mt-4">{hint}</p> : null}
    </article>
  );
}
