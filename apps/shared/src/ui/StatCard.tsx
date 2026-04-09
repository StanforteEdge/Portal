import { Chip } from "./Chip";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "success" | "warning" | "pending" | "danger";
  hint?: string;
};

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  hint,
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
        {delta ? <Chip variant={tone}>{delta}</Chip> : null}
      </div>
      {hint ? <p className="field-help mt-4">{hint}</p> : null}
    </article>
  );
}
