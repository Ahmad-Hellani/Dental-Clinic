import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-brand-900 p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-white font-serif text-lg font-bold text-brand-800">S</span>
          <span className="font-serif text-lg font-bold">Smile Clinic</span>
        </Link>
        <div>
          <h1 className="!text-white">Healthy smiles start with an easy booking.</h1>
          <p className="mt-4 max-w-md text-brand-100">Choose a treatment, pick your dentist and reserve a time in under a minute. Manage every visit from one place.</p>
        </div>
        <p className="text-xs text-brand-200">Cloud-native demo · authentication, clinic and web as separate microservices</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md"><Outlet /></div>
      </main>
    </div>
  );
}
