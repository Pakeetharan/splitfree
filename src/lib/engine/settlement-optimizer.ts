import type { BalanceEntry, TransferSuggestion } from "@/types/api";

/**
 * Greedy netting algorithm to minimize the number of payments.
 *
 * Input:  array of { memberId, name, netBalance } (positive=owed, negative=owes)
 * Output: minimal set of transfers to settle all debts
 */
export function computeOptimalSettlements(
  balances: BalanceEntry[],
): TransferSuggestion[] {
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ ...b, amount: b.netBalance }));
  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ ...b, amount: Math.abs(b.netBalance) }));

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: TransferSuggestion[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const transferAmount = Math.min(creditor.amount, debtor.amount);

    if (transferAmount > 0) {
      transfers.push({
        from: debtor.memberId,
        fromName: debtor.name,
        to: creditor.memberId,
        toName: creditor.name,
        amount: transferAmount,
      });
    }

    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return transfers;
}
