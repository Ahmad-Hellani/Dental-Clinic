import { z } from "zod";
import { emailSchema, fullNameSchema, passwordSchema, phoneSchema, roleSchema } from "../../shared/validation";

export const listUsersQuery = z.object({
  search: z.string().trim().max(100).optional(),
  role: roleSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParams = z.object({ id: z.string().uuid("Invalid user id") });

export const updateUserBody = z
  .object({
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((b) => b.role !== undefined || b.isActive !== undefined, {
    message: "Provide role and/or isActive",
  });

// Admin-created accounts (e.g. new dentists) can have any role
export const createUserBody = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  role: roleSchema.default("PATIENT"),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type UpdateUserBody = z.infer<typeof updateUserBody>;
export type CreateUserBody = z.infer<typeof createUserBody>;
