import { Fragment, ReactNode } from "react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SlideOver({ open, onClose, children }: SlideOverProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        {children}
      </div>
    </div>
  );
}

type SlideOverPanelProps = {
  children: ReactNode;
};

export function SlideOverPanel({ children }: SlideOverPanelProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}

type SlideOverHeaderProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
};

export function SlideOverHeader({ title, subtitle, onClose }: SlideOverHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

type SlideOverContentProps = {
  children: ReactNode;
  className?: string;
};

export function SlideOverContent({ children, className = "" }: SlideOverContentProps) {
  return <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>;
}

type SlideOverFooterProps = {
  children: ReactNode;
};

export function SlideOverFooter({ children }: SlideOverFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
      {children}
    </div>
  );
}
