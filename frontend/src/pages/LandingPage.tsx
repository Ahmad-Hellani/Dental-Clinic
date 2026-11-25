import { Link } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Spinner } from "../components/atoms/Spinner";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { DentistCard } from "../components/molecules/DentistCard";
import { TreatmentCard } from "../components/molecules/TreatmentCard";
import { useAuth, homePathFor } from "../context/AuthContext";
import { listDentists } from "../services/dentists.service";
import { listTreatments } from "../services/treatments.service";
import { useFetch } from "../lib/useFetch";

const STEPS = [
  ["1", "Choose a treatment", "Browse checkups, fillings, whitening, braces and more, with clear prices and durations."],
  ["2", "Pick your dentist", "See specialties, rooms and working hours, then choose who you'd like to see."],
  ["3", "Reserve a time", "Only genuinely free slots are shown, so your booking is never double-booked."],
];

export default function LandingPage() {
  const { user } = useAuth();
  const treatments = useFetch(() => listTreatments(), []);
  const dentists = useFetch(() => listDentists(), []);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dental care, simplified</p>
            <h1 className="mt-3 !text-5xl">Book your dental visit online, in under a minute.</h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">Real-time availability, friendly specialists and every appointment tracked in one dashboard.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to={homePathFor(user.role)}><Button>Go to my dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/register"><Button>Create an account</Button></Link>
                  <Link to="/login"><Button variant="secondary">Log in</Button></Link>
                </>
              )}
            </div>
          </div>
          <div className="card grid grid-cols-3 divide-x divide-line text-center">
            {[["8+", "Treatments"], ["2", "Specialists"], ["30 min", "Slot grid"]].map(([n, l]) => (
              <div key={l} className="px-4 py-10"><p className="font-serif text-3xl font-bold text-brand-700">{n}</p><p className="mt-1 text-sm text-ink-muted">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-6">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="card p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{n}</span>
              <h3 className="mt-3">{t}</h3>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="treatments" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="mb-6">Our treatments</h2>
          {treatments.loading ? <Spinner /> : treatments.error ? <AlertBanner tone="error">{treatments.error}</AlertBanner> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(treatments.data ?? []).map((t) => <TreatmentCard key={t.id} treatment={t} />)}
            </div>
          )}
        </div>
      </section>

      <section id="dentists" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-6">Meet our dentists</h2>
        {dentists.loading ? <Spinner /> : dentists.error ? <AlertBanner tone="error">{dentists.error}</AlertBanner> : (
          <div className="grid gap-4 md:grid-cols-2">
            {(dentists.data ?? []).map((d) => <DentistCard key={d.id} dentist={d} />)}
          </div>
        )}
      </section>
    </>
  );
}
