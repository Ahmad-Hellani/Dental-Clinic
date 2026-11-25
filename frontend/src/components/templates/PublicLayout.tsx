import { Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Smile Clinic. IN401 microservices lab project.</p>
          <p>Open Sun–Sat, by appointment</p>
        </div>
      </footer>
    </div>
  );
}
