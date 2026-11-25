import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "border border-brand-600 bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-canvas",
  ghost: "border border-transparent bg-transparent text-ink-soft hover:bg-canvas",
  danger: "border border-red-200 bg-surface text-red-700 hover:bg-red-50",
};
const sizes: Record<Size, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "primary", size = "md", loading = false, className, disabled, children, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
}
