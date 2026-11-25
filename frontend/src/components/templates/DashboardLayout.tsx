import type { ReactNode } from "react";
import { Navbar } from "../organisms/Navbar";
import { Sidebar, type SidebarItem } from "../organisms/Sidebar";

export function DashboardLayout({ title, subtitle, items, active, onSelect, children }: {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  active: string;
  onSelect: (key: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar variant="app" />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[210px_minmax(0,1fr)]">
        <aside><Sidebar items={items} active={active} onSelect={onSelect} /></aside>
        <main className="min-w-0">
          <div className="mb-6">
            <h1>{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
