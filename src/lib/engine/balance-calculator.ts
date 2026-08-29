import { ObjectId } from "mongodb";
import {
  getExpensesCollection,
  getSettlementsCollection,
  getMembersCollection,
  getGroupsCollection,
} from "@/lib/mongodb/collections";
import type { BalanceEntry } from "@/types/api";
import { computeBalancesFromDocs } from "@/lib/engine/balance-math";

export { computeBalancesFromDocs } from "@/lib/engine/balance-math";

async function fetchGroupBalanceDocs(groupOid: ObjectId) {
  const members = await getMembersCollection();
  const expenses = await getExpensesCollection();
  const settlements = await getSettlementsCollection();

  const [memberDocs, expenseDocs, settlementDocs] = await Promise.all([
    members.find({ groupId: groupOid, deletedAt: null }).toArray(),
    expenses.find({ groupId: groupOid, deletedAt: null }).toArray(),
    settlements.find({ groupId: groupOid, deletedAt: null }).toArray(),
  ]);

  return { memberDocs, expenseDocs, settlementDocs };
}

/**
 * Compute balances for an authenticated group member. Verifies membership
 * before returning any data.
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

  const { memberDocs, expenseDocs, settlementDocs } =
    await fetchGroupBalanceDocs(groupOid);

  return computeBalancesFromDocs(memberDocs, expenseDocs, settlementDocs);
}

/**
 * Compute balances for a group without an authenticated member — used by the
 * public share-link view. Callers are responsible for validating the share
 * token before calling this.
 */
export async function computeBalancesForShare(
  groupId: string,
): Promise<BalanceEntry[]> {
  const groupOid = new ObjectId(groupId);
  const { memberDocs, expenseDocs, settlementDocs } =
    await fetchGroupBalanceDocs(groupOid);

  return computeBalancesFromDocs(memberDocs, expenseDocs, settlementDocs);
}
