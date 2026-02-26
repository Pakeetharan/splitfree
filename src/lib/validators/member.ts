import { z } from "zod";

// ─── Add Member ──────────────────────────────────────────
export const addMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

// ─── Update Member ───────────────────────────────────────
export const updateMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
