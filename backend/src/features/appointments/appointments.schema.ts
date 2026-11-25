import { z } from "zod";
import {
  appointmentStatusSchema,
  dateSchema,
  paginationQuery,
  timeSchema,
  uuidSchema,
} from "../../shared/validation";

export const createAppointmentBody = z.object({
  treatmentId: uuidSchema,
  dentistId: uuidSchema,
  date: dateSchema,
  startTime: timeSchema,
  patientNotes: z.string().trim().max(1000).optional(),
});

export const mineQuery = z.object({
  scope: z.enum(["upcoming", "past", "all"]).default("all"),
  status: appointmentStatusSchema.optional(),
});

export const scheduleQuery = z.object({
  from: dateSchema.optional(), // defaults to today
  to: dateSchema.optional(),
  status: appointmentStatusSchema.optional(),
});

export const adminListQuery = z.object({
  status: appointmentStatusSchema.optional(),
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  dentistId: uuidSchema.optional(),
  search: z.string().trim().max(100).optional(), // patient name / email
  ...paginationQuery,
});

export const updateStatusBody = z
  .object({
    status: appointmentStatusSchema.optional(),
    dentistNotes: z.string().trim().max(2000).optional(),
  })
  .refine((b) => b.status !== undefined || b.dentistNotes !== undefined, {
    message: "Provide status and/or dentistNotes",
  });

export type CreateAppointmentBody = z.infer<typeof createAppointmentBody>;
export type MineQuery = z.infer<typeof mineQuery>;
export type ScheduleQuery = z.infer<typeof scheduleQuery>;
export type AdminListQuery = z.infer<typeof adminListQuery>;
export type UpdateStatusBody = z.infer<typeof updateStatusBody>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
