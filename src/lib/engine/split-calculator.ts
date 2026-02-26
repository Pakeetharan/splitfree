/**
 * Equal-split calculator with remainder distribution (round-robin).
 *
 * Example:
 *   amountCents = 8500, splitAmong = 3 members
 *   baseSplit = floor(8500 / 3) = 2833
 *   remainder = 8500 - (2833 * 3) = 1
 *   Result: [2834, 2833, 2833]
 */

export interface SplitResult {
  memberId: string;
  amountCents: number;
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
 * Returns the per-person base amount (used for display in expense cards).
 * The actual split is stored per-member in splitAmounts.
 */
export function baseSplitAmount(totalCents: number, count: number): number {
  if (count === 0) return 0;
  return Math.floor(totalCents / count);
}
