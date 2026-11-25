import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Input } from "../components/atoms/Input";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { FormField } from "../components/molecules/FormField";
import { homePathFor, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/errors";

const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS = [
  { label: "Patient", detail: "Book & manage visits", email: "patient@dentalclinic.com" },
  { label: "Dr. Sara", detail: "Orthodontics", email: "dr.sara@dentalclinic.com" },
  { label: "Dr. Karim", detail: "General & Cosmetic", email: "dr.karim@dentalclinic.com" },
  { label: "Admin", detail: "Clinic overview", email: "admin@dentalclinic.com" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={from && from.startsWith(homePathFor(user.role)) ? from : homePathFor(user.role)} replace />;

  async function doLogin(e: string, p: string, key: string) {
    setBusy(key);
    setError(null);
    try {
      const u = await login(e, p);
      navigate(from && from.startsWith(homePathFor(u.role)) ? from : homePathFor(u.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void doLogin(email.trim(), password, "form");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Log in to manage your appointments.</p>
      </div>

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
        <FormField label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></FormField>
        <Button type="submit" className="w-full" loading={busy === "form"} disabled={!!busy && busy !== "form"}>Log in</Button>
      </form>

      <p className="text-center text-sm text-ink-muted">New here? <Link to="/register" className="link">Create an account</Link></p>

      <section className="card p-4" aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="!text-base">Quick demo login</h2>
        <p className="mt-1 text-xs text-ink-muted">One click, no typing. Password for all demo accounts: <code className="rounded bg-canvas px-1">{DEMO_PASSWORD}</code></p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Button key={a.email} variant="secondary" className="!flex-col !items-start !gap-0 !py-2 text-left" loading={busy === a.email} disabled={!!busy && busy !== a.email} onClick={() => doLogin(a.email, DEMO_PASSWORD, a.email)}>
              <span>{a.label}</span>
              <span className="text-[11px] font-normal text-ink-muted">{a.detail}</span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
