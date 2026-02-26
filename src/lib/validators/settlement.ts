import { z } from "zod";

export const createSettlementSchema = z.object({
  payer: z.string().min(1, "Payer is required"),
  payee: z.string().min(1, "Payee is required"),
  amount: z
    .number()
    .int("Amount must be in cents (integer)")
    .positive("Amount must be positive"),
  note: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
