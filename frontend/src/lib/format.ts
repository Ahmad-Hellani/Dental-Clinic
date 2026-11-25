import type { DayCode } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const parseISODate = (s: string) => new Date(`${s}T00:00:00`);

export const formatDate = (s: string) =>
  parseISODate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

export const formatPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const formatDuration = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;

export const DAY_CODES: DayCode[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DAY_LABELS: Record<DayCode, string> = {
  SUN: "Sun", MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat",
};
export const dayCodeOf = (iso: string): DayCode => DAY_CODES[parseISODate(iso).getDay()];

export const formatDays = (days: DayCode[]) =>
  DAY_CODES.filter((d) => days.includes(d)).map((d) => DAY_LABELS[d]).join(", ");
