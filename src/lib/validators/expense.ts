import { z } from "zod";

// ─── Create Expense ──────────────────────────────────────
export const createExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  amount: z
    .number()
    .int("Amount must be in cents (integer)")
    .positive("Amount must be positive"),
  paidBy: z.string().min(1, "Payer is required"),
  splitAmong: z
    .array(z.string().min(1))
    .min(1, "Must split among at least one member"),
  category: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ─── Update Expense ──────────────────────────────────────
export const updateExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less")
    .optional(),
  amount: z
    .number()
    .int("Amount must be in cents (integer)")
    .positive("Amount must be positive")
    .optional(),
  paidBy: z.string().min(1).optional(),
  splitAmong: z.array(z.string().min(1)).min(1).optional(),
  category: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
  _version: z.number().int("Version must be an integer"),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
