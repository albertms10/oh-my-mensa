import type { ReactNode } from "react";

export function Card({
  title, subtitle, action, children, className = "", id,
}: {
  title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
            {subtitle && <p className="text-sm text-zinc-600">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message = "No dishes match the current filters." }: { message?: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-600">
      {message}
    </div>
  );
}
