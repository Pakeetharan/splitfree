import { z } from "zod";

export const createShareTokenSchema = z.object({
  expiresInHours: z
    .number()
    .int()
    .min(1, "Minimum 1 hour")
    .max(168, "Maximum 168 hours (7 days)")
    .default(72),
});

export type CreateShareTokenInput = z.infer<typeof createShareTokenSchema>;
