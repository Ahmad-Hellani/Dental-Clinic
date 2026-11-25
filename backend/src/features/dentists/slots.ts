import { dayCodeOf, fromMinutes, toMinutes, type DayCode } from "../../shared/time";

export const SLOT_STEP_MINUTES = 30;

export type Slot = { startTime: string; endTime: string };

type SlotInput = {
  date: string;
  workingDays: DayCode[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  /** PENDING / CONFIRMED appointments of that dentist on that date */
  booked: { start_time: string; end_time: string }[];
  now: { date: string; minutes: number };
};

/**
 * Pure function: every STEP-minute start inside the working hours where the whole treatment fits,
 * minus anything overlapping a booked appointment, minus times already in the past (today).
 */
export function computeSlots(p: SlotInput): Slot[] {
  if (p.date < p.now.date) return [];
  if (!p.workingDays.includes(dayCodeOf(p.date))) return [];

  const open = toMinutes(p.startTime);
  const close = toMinutes(p.endTime);
  const bookedRanges = p.booked.map((b) => [toMinutes(b.start_time), toMinutes(b.end_time)] as const);

  const slots: Slot[] = [];
  for (let start = open; start + p.durationMinutes <= close; start += SLOT_STEP_MINUTES) {
    const end = start + p.durationMinutes;
    if (p.date === p.now.date && start <= p.now.minutes) continue;
    if (bookedRanges.some(([bStart, bEnd]) => start < bEnd && end > bStart)) continue;
    slots.push({ startTime: fromMinutes(start), endTime: fromMinutes(end) });
  }
  return slots;
}
