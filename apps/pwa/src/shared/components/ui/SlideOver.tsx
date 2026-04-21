import { Fragment, ReactNode } from "react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SlideOver({ open, onClose, children }: SlideOverProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end">
      <div className="absolute inset-0 top-16 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md flex flex-col bg-white shadow-xl max-h-[calc(100vh-4rem)]">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

type SlideOverPanelProps = {
  children: ReactNode;
};

export function SlideOverPanel({ children }: SlideOverPanelProps) {
  return <div className="flex flex-col min-h-0 h-full">{children}</div>;
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
  return <div className={`flex-1 min-h-0 overflow-y-auto ${className}`}>{children}</div>;
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
