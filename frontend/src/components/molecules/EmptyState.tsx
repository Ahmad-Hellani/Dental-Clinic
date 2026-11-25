import type { ReactNode } from "react";

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <p className="font-serif text-lg font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
