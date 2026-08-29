import { z } from "zod";
import {
  validateExactSplit,
  validatePercentageSplit,
  validateSharesSplit,
} from "@/lib/engine/split-calculator";

const splitTypeSchema = z.enum(["equal", "exact", "percentage", "shares"]);

const splitValueSchema = z.object({
  memberId: z.string().min(1),
  value: z.number(),
});

function validateSplitValues(
  splitType: z.infer<typeof splitTypeSchema>,
  splitValues: z.infer<typeof splitValueSchema>[] | undefined,
  splitAmong: string[],
  amount: number,
  ctx: z.RefinementCtx,
) {
  if (splitType === "equal") return;

  if (!splitValues || splitValues.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "splitValues is required for non-equal split types",
      path: ["splitValues"],
    });
    return;
  }

  const splitAmongSet = new Set(splitAmong);
  const valueIds = new Set(splitValues.map((v) => v.memberId));
  if (
    valueIds.size !== splitAmongSet.size ||
    ![...splitAmongSet].every((id) => valueIds.has(id))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "splitValues must have exactly one entry per member in splitAmong",
      path: ["splitValues"],
    });
    return;
  }

  const error =
    splitType === "exact"
      ? validateExactSplit(amount, splitValues)
      : splitType === "percentage"
        ? validatePercentageSplit(splitValues)
        : validateSharesSplit(splitValues);

  if (error) {
    ctx.addIssue({ code: "custom", message: error, path: ["splitValues"] });
  }
}

// ─── Create Expense ──────────────────────────────────────
export const createExpenseSchema = z
  .object({
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
    splitType: splitTypeSchema.default("equal"),
    splitValues: z.array(splitValueSchema).optional(),
    category: z.string().optional(),
    notes: z.string().trim().max(1000, "Notes must be 1000 characters or less").optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  })
  .superRefine((data, ctx) => {
    validateSplitValues(
      data.splitType,
      data.splitValues,
      data.splitAmong,
      data.amount,
      ctx,
    );
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ─── Update Expense ──────────────────────────────────────
export const updateExpenseSchema = z
  .object({
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
    splitType: splitTypeSchema.optional(),
    splitValues: z.array(splitValueSchema).optional(),
    category: z.string().optional(),
    notes: z.string().trim().max(1000, "Notes must be 1000 characters or less").optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
      .optional(),
    _version: z.number().int("Version must be an integer"),
  })
  .superRefine((data, ctx) => {
    // Structural check only — the numeric sum/shape validation runs in
    // expense.service.ts once the patch is merged with the existing
    // expense, since a partial update may change amount/splitAmong/
    // splitValues independently and the schema alone can't see the
    // resulting effective values.
    if (data.splitType && data.splitType !== "equal" && !data.splitValues) {
      ctx.addIssue({
        code: "custom",
        message: "splitValues is required when changing splitType",
        path: ["splitValues"],
      });
    }
  });

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
