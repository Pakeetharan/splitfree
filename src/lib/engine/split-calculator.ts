/**
 * Split calculators. Every function distributes `totalCents` across members
 * using floor-then-remainder-by-index, so results always sum back to exactly
 * `totalCents` (no cent lost or gained to rounding).
 *
 * Example (equal):
 *   amountCents = 8500, splitAmong = 3 members
 *   baseSplit = floor(8500 / 3) = 2833
 *   remainder = 8500 - (2833 * 3) = 1
 *   Result: [2834, 2833, 2833]
 */

export interface SplitResult {
  memberId: string;
  amountCents: number;
}

export interface SplitValueInput {
  memberId: string;
  value: number;
}

function distributeByWeight(
  totalCents: number,
  weights: { memberId: string; weight: number }[],
  totalWeight: number,
): SplitResult[] {
  const raw = weights.map((w) => ({
    memberId: w.memberId,
    amountCents: Math.floor((totalCents * w.weight) / totalWeight),
  }));
  const distributed = raw.reduce((sum, r) => sum + r.amountCents, 0);
  const remainder = totalCents - distributed;

  return raw.map((r, i) => ({
    ...r,
    amountCents: i < remainder ? r.amountCents + 1 : r.amountCents,
  }));
}

export function calculateEqualSplit(
  totalCents: number,
  memberIds: string[],
): SplitResult[] {
  if (memberIds.length === 0) return [];

  const n = memberIds.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;

  return memberIds.map((memberId, i) => ({
    memberId,
    amountCents: i < remainder ? base + 1 : base,
  }));
}

/**
 * Exact-amount split. `values[].value` is the exact cents each member owes;
 * validated by `validateExactSplit` to sum to `totalCents` before calling.
 */
export function calculateExactSplit(
  totalCents: number,
  values: SplitValueInput[],
): SplitResult[] {
  return values.map((v) => ({ memberId: v.memberId, amountCents: v.value }));
}

export function validateExactSplit(
  totalCents: number,
  values: SplitValueInput[],
): string | null {
  if (values.length === 0) return "At least one member must have a split amount";
  if (values.some((v) => v.value < 0)) return "Split amounts cannot be negative";
  const sum = values.reduce((s, v) => s + v.value, 0);
  if (sum !== totalCents) return "Split amounts must add up to the total";
  return null;
}

/**
 * Percentage split. `values[].value` is percentage points (0-100),
 * validated to sum to 100 before calling.
 */
export function calculatePercentageSplit(
  totalCents: number,
  values: SplitValueInput[],
): SplitResult[] {
  return distributeByWeight(
    totalCents,
    values.map((v) => ({ memberId: v.memberId, weight: v.value })),
    100,
  );
}

export function validatePercentageSplit(values: SplitValueInput[]): string | null {
  if (values.length === 0) return "At least one member must have a percentage";
  if (values.some((v) => v.value < 0)) return "Percentages cannot be negative";
  const sum = values.reduce((s, v) => s + v.value, 0);
  if (sum !== 100) return "Percentages must add up to 100";
  return null;
}

/**
 * Shares split. `values[].value` is an integer share count; the total is
 * distributed proportionally to shares.
 */
export function calculateSharesSplit(
  totalCents: number,
  values: SplitValueInput[],
): SplitResult[] {
  const totalShares = values.reduce((s, v) => s + v.value, 0);
  if (totalShares === 0) return values.map((v) => ({ memberId: v.memberId, amountCents: 0 }));
  return distributeByWeight(
    totalCents,
    values.map((v) => ({ memberId: v.memberId, weight: v.value })),
    totalShares,
  );
}

export function validateSharesSplit(values: SplitValueInput[]): string | null {
  if (values.length === 0) return "At least one member must have shares";
  if (values.some((v) => !Number.isInteger(v.value) || v.value < 1)) {
    return "Shares must be positive whole numbers";
  }
  return null;
}

/**
 * Returns the per-person base amount (used for display in expense cards).
 * The actual split is stored per-member in splitDetails.
 */
export function baseSplitAmount(totalCents: number, count: number): number {
  if (count === 0) return 0;
  return Math.floor(totalCents / count);
}
