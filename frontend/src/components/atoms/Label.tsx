import type { LabelHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft", className)} {...rest} />;
}
