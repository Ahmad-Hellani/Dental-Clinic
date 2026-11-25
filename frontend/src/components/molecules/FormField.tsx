import type { ReactNode } from "react";
import { Label } from "../atoms/Label";

export function FormField({ label, htmlFor, hint, error, children }: { label: string; htmlFor?: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
