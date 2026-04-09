import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant | "outline" | "info";
  size?: ButtonSize;
  children: ReactNode;
};

const base = "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus:ring-4 focus:ring-brand-900/10 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant | "outline" | "info", string> = {
  primary:
    "bg-brand-900 text-white shadow-soft hover:bg-brand-700 hover:shadow-card",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  outline:
    "border border-brand-900/20 bg-white text-brand-900 hover:bg-brand-900/5",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  danger: "bg-danger text-white hover:opacity-90",
  info: "bg-sky-600 text-white hover:bg-sky-500",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[base, variants[variant], sizes[size], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
