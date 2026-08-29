/**
 * Pure balance math with no I/O — kept dependency-free (no Mongo imports) so
 * it can be unit tested without a database connection. `balance-calculator.ts`
 * wraps this with the actual data fetching.
 */
import type { BalanceEntry } from "@/types/api";
import type { DbExpense, DbMember, DbSettlement, SplitDetail } from "@/types/database";

export type BalanceExpense = Pick<
  DbExpense,
  "paidBy" | "splitAmong" | "amount" | "splitDetails"
>;

/**
 * Resolve the per-member split for an expense. Uses the materialized
 * splitDetails when present; falls back to an on-the-fly equal split for
 * older documents written before splitDetails existed.
 */
function resolveSplitDetails(expense: BalanceExpense): SplitDetail[] {
  if (expense.splitDetails && expense.splitDetails.length > 0) {
    return expense.splitDetails;
  }

  const splitCount = expense.splitAmong.length;
  if (splitCount === 0) return [];

  const base = Math.floor(expense.amount / splitCount);
  const remainder = expense.amount - base * splitCount;

  return expense.splitAmong.map((memberId, idx) => ({
    memberId,
    amount: idx < remainder ? base + 1 : base,
  }));
}

/**
 * Pure balance computation over already-fetched documents.
 *
 * Positive netBalance = member is owed money (others owe them).
 * Negative netBalance = member owes money to others.
 *
 * Formula per member:
 *   netBalance = totalPaid - totalOwed - totalSettledOut + totalSettledIn
 *
 * Where:
 *   totalPaid       = sum of expense.amount WHERE paidBy == member
 *   totalOwed       = sum of that member's resolved splitDetails amount
 *   totalSettledOut = sum of settlement.amount WHERE payer == member
 *   totalSettledIn  = sum of settlement.amount WHERE payee == member
 */
export function computeBalancesFromDocs(
  members: Pick<DbMember, "_id" | "name">[],
  expenses: BalanceExpense[],
  settlements: Pick<DbSettlement, "payer" | "payee" | "amount">[],
): BalanceEntry[] {
  // Initialize balance map
  const balanceMap = new Map<string, number>(
    members.map((m) => [m._id.toHexString(), 0]),
  );
  // Tracks each member's own share of expenses (what they actually spent),
  // regardless of who fronted the money.
  const totalSpentMap = new Map<string, number>(
    members.map((m) => [m._id.toHexString(), 0]),
  );

  // Process expenses
  for (const expense of expenses) {
    const payerId = expense.paidBy.toHexString();
    const details = resolveSplitDetails(expense);
    if (details.length === 0) continue;

    // Payer gets credited the full amount
    const payerBal = balanceMap.get(payerId) ?? 0;
    balanceMap.set(payerId, payerBal + expense.amount);

    // Each split member gets debited their resolved share, and it counts
    // toward their total spend for the trip
    for (const detail of details) {
      const mid = detail.memberId.toHexString();
      const curBal = balanceMap.get(mid) ?? 0;
      balanceMap.set(mid, curBal - detail.amount);
      totalSpentMap.set(mid, (totalSpentMap.get(mid) ?? 0) + detail.amount);
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const payerId = settlement.payer.toHexString();
    const payeeId = settlement.payee.toHexString();

    const payerBal = balanceMap.get(payerId) ?? 0;
    balanceMap.set(payerId, payerBal + settlement.amount); // payer reduces their debt

    const payeeBal = balanceMap.get(payeeId) ?? 0;
    balanceMap.set(payeeId, payeeBal - settlement.amount); // payee reduces credit
  }

  // Build response
  return members.map((m) => ({
    memberId: m._id.toHexString(),
    name: m.name || `Member`,
    netBalance: balanceMap.get(m._id.toHexString()) ?? 0,
    totalSpent: totalSpentMap.get(m._id.toHexString()) ?? 0,
  }));
}
