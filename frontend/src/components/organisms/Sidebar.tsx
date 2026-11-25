import { cn } from "../../lib/cn";

export type SidebarItem = { key: string; label: string };

export function Sidebar({ items, active, onSelect }: { items: SidebarItem[]; active: string; onSelect: (key: string) => void }) {
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded px-3 py-2 text-left text-sm font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
            active === item.key ? "bg-ink text-white" : "text-ink-soft hover:bg-surface hover:text-ink",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
