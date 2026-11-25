import { z } from "zod";
import { booleanQuery, dateSchema, dayCodeSchema, timeSchema, uuidSchema } from "../../shared/validation";

export const listDentistsQuery = z.object({
  includeInactive: booleanQuery.default("false"), // honoured for ADMIN only
});

export const slotsQuery = z.object({
  date: dateSchema,
  treatmentId: uuidSchema,
});

const workingDays = z
  .array(dayCodeSchema)
  .min(1, "Select at least one working day")
  .transform((days) => [...new Set(days)]);

const dentistFields = {
  fullName: z.string().trim().min(2).max(120),
  specialty: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000),
  roomNumber: z.string().trim().min(1).max(30),
  workingDays,
  startTime: timeSchema,
  endTime: timeSchema,
};

export const createDentistBody = z
  .object({
    userId: uuidSchema, // id of a DENTIST account in the authentication service
    ...dentistFields,
    fullName: dentistFields.fullName.optional(), // defaults to the auth account's name
    bio: dentistFields.bio.default(""),
  })
  .refine((b) => b.startTime < b.endTime, { message: "startTime must be before endTime", path: ["endTime"] });

export const updateDentistBody = z
  .object({ ...dentistFields, isActive: z.boolean() })
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: "Provide at least one field to update" });

export type ListDentistsQuery = z.infer<typeof listDentistsQuery>;
export type SlotsQuery = z.infer<typeof slotsQuery>;
export type CreateDentistBody = z.infer<typeof createDentistBody>;
export type UpdateDentistBody = z.infer<typeof updateDentistBody>;
