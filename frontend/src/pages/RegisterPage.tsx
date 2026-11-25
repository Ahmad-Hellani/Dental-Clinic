import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Input } from "../components/atoms/Input";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { FormField } from "../components/molecules/FormField";
import { homePathFor, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/errors";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      const u = await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || undefined });
      navigate(homePathFor(u.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Patients can book and manage visits online.</p>
      </div>
      {error && <AlertBanner tone="error">{error}</AlertBanner>}
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Full name" htmlFor="fullName"><Input id="fullName" autoComplete="name" required minLength={2} value={form.fullName} onChange={set("fullName")} /></FormField>
        <FormField label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} /></FormField>
        <FormField label="Phone (optional)" htmlFor="phone"><Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="+961 70 000 000" /></FormField>
        <FormField label="Password" htmlFor="password" hint="At least 8 characters, with a letter and a number."><Input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set("password")} /></FormField>
        <FormField label="Confirm password" htmlFor="confirm"><Input id="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} /></FormField>
        <Button type="submit" className="w-full" loading={busy}>Create account</Button>
      </form>
      <p className="text-center text-sm text-ink-muted">Already registered? <Link to="/login" className="link">Log in</Link></p>
    </div>
  );
}
