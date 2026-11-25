import { z } from "zod";
import { booleanQuery } from "../../shared/validation";

export const listTreatmentsQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  includeInactive: booleanQuery.default("false"), // honoured for ADMIN only
});

const treatmentFields = {
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000),
  durationMinutes: z.number().int().min(15).max(240).multipleOf(15, "Duration must be a multiple of 15 minutes"),
  price: z
    .number()
    .min(0)
    .max(99_999_999)
    .transform((v) => Math.round(v * 100) / 100),
  category: z.string().trim().min(2).max(60),
};

export const createTreatmentBody = z.object({
  ...treatmentFields,
  description: treatmentFields.description.default(""),
});

export const updateTreatmentBody = z
  .object({ ...treatmentFields, isActive: z.boolean() })
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: "Provide at least one field to update" });

export type ListTreatmentsQuery = z.infer<typeof listTreatmentsQuery>;
export type CreateTreatmentBody = z.infer<typeof createTreatmentBody>;
export type UpdateTreatmentBody = z.infer<typeof updateTreatmentBody>;
