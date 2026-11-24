import { z } from "zod";

export const roleSchema = z.enum(["PATIENT", "DENTIST", "ADMIN"]);

export const fullNameSchema = z.string().trim().min(2, "Full name is too short").max(120);

export const emailSchema = z.string().trim().toLowerCase().email("Invalid email address").max(254);

// bcrypt only uses the first 72 bytes, so cap the length
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, "Invalid phone number");
