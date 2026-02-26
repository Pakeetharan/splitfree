import { ObjectId } from "mongodb";
import {
  getExpensesCollection,
  getSettlementsCollection,
  getMembersCollection,
  getGroupsCollection,
} from "@/lib/mongodb/collections";
import type { BalanceEntry } from "@/types/api";

/**
 * Compute the net balance for each active member in a group.
 * Positive = member is owed money (others owe them).
 * Negative = member owes money to others.
 *
 * Formula per member:
 *   netBalance = totalPaid - totalOwed - totalSettledOut + totalSettledIn
 *
 * Where:
 *   totalPaid       = sum of expense.amount WHERE paidBy == member
 *   totalOwed       = sum of expense.splitAmount WHERE member is in splitAmong
 *   totalSettledOut = sum of settlement.amount WHERE payer == member
 *   totalSettledIn  = sum of settlement.amount WHERE payee == member
 */
export async function computeBalances(
  userId: string,
  groupId: string,
): Promise<BalanceEntry[]> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) {
    throw new Response(JSON.stringify({ error: "Group not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify user membership
  const members = await getMembersCollection();
  const userOid = new ObjectId(userId);
  const membership = await members.findOne({
    groupId: groupOid,
    userId: userOid,
    deletedAt: null,
  });
  if (!membership) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get all active members
  const memberDocs = await members
    .find({ groupId: groupOid, deletedAt: null })
    .toArray();

  const expenses = await getExpensesCollection();
  const settlements = await getSettlementsCollection();

  const [expenseDocs, settlementDocs] = await Promise.all([
    expenses.find({ groupId: groupOid, deletedAt: null }).toArray(),
    settlements.find({ groupId: groupOid, deletedAt: null }).toArray(),
  ]);

  // Initialize balance map
  const balanceMap = new Map<string, number>(
    memberDocs.map((m) => [m._id.toHexString(), 0]),
  );

  // Process expenses
  for (const expense of expenseDocs) {
    const payerId = expense.paidBy.toHexString();
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) continue;

    const base = Math.floor(expense.amount / splitCount);
    const remainder = expense.amount - base * splitCount;

    // Payer gets credited the full amount
    const payerBal = balanceMap.get(payerId) ?? 0;
    balanceMap.set(payerId, payerBal + expense.amount);

    // Each split member gets debited their share
    expense.splitAmong.forEach((memberId, idx) => {
      const mid = memberId.toHexString();
      const share = idx < remainder ? base + 1 : base;
      const curBal = balanceMap.get(mid) ?? 0;
      balanceMap.set(mid, curBal - share);
    });
  }

  // Process settlements
  for (const settlement of settlementDocs) {
    const payerId = settlement.payer.toHexString();
    const payeeId = settlement.payee.toHexString();

    const payerBal = balanceMap.get(payerId) ?? 0;
    balanceMap.set(payerId, payerBal + settlement.amount); // payer reduces their debt

    const payeeBal = balanceMap.get(payeeId) ?? 0;
    balanceMap.set(payeeId, payeeBal - settlement.amount); // payee reduces credit
  }

  // Build response
  return memberDocs.map((m) => ({
    memberId: m._id.toHexString(),
    name: m.name || `Member`,
    netBalance: balanceMap.get(m._id.toHexString()) ?? 0,
  }));
}
