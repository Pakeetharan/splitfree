import { z } from "zod";

// ─── Create Group ────────────────────────────────────────
export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .toUpperCase(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// ─── Update Group ────────────────────────────────────────
export const updateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .toUpperCase()
    .optional(),
  _version: z.number().int("Version must be an integer"),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
