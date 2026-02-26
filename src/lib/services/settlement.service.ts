import { ObjectId } from "mongodb";
import {
  getSettlementsCollection,
  getGroupsCollection,
  getMembersCollection,
} from "@/lib/mongodb/collections";
import type { CreateSettlementInput } from "@/lib/validators/settlement";
import type { DbSettlement } from "@/types/database";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

interface GroupMemberInfo {
  groupOid: ObjectId;
  isOwner: boolean;
  callerMemberId: ObjectId;
}

async function assertGroupMember(userId: string, groupId: string): Promise<GroupMemberInfo> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) throw notFound();

  const members = await getMembersCollection();
  const userOid = new ObjectId(userId);
  const membership = await members.findOne({
    groupId: groupOid,
    userId: userOid,
    deletedAt: null,
  });
  if (!membership) throw forbidden();
  const isOwner = group.createdBy.toHexString() === userId;
  return { groupOid, isOwner, callerMemberId: membership._id };
}

// ─── List Settlements ─────────────────────────────────────

export async function listSettlements(
  userId: string,
  groupId: string,
): Promise<DbSettlement[]> {
  const { groupOid } = await assertGroupMember(userId, groupId);
  const settlements = await getSettlementsCollection();
  return settlements
    .find({ groupId: groupOid, deletedAt: null })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}

// ─── Create Settlement ────────────────────────────────────

export async function createSettlement(
  userId: string,
  groupId: string,
  data: CreateSettlementInput,
): Promise<DbSettlement> {
  const { groupOid, isOwner, callerMemberId } = await assertGroupMember(userId, groupId);

  // Non-owners can only record settlements where they are the payer
  if (!isOwner && data.payer !== callerMemberId.toHexString()) {
    throw new Response(
      JSON.stringify({ error: "You can only record settlements where you are the payer" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate payer and payee belong to group
  const members = await getMembersCollection();
  const payerOid = new ObjectId(data.payer);
  const payeeOid = new ObjectId(data.payee);

  const [payer, payee] = await Promise.all([
    members.findOne({ _id: payerOid, groupId: groupOid, deletedAt: null }),
    members.findOne({ _id: payeeOid, groupId: groupOid, deletedAt: null }),
  ]);

  if (!payer) {
    throw new Response(JSON.stringify({ error: "Payer is not a group member" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!payee) {
    throw new Response(JSON.stringify({ error: "Payee is not a group member" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (data.payer === data.payee) {
    throw new Response(
      JSON.stringify({ error: "Payer and payee cannot be the same person" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date();
  const settlement: DbSettlement = {
    _id: new ObjectId(),
    groupId: groupOid,
    payer: payerOid,
    payee: payeeOid,
    amount: data.amount,
    note: data.note ?? null,
    date: new Date(data.date),
    createdBy: new ObjectId(userId),
    createdAt: now,
    updatedAt: now,
    _version: 1,
    deletedAt: null,
  };

  const settlements = await getSettlementsCollection();
  await settlements.insertOne(settlement);
  return settlement;
}

// ─── Delete Settlement ────────────────────────────────────

export async function deleteSettlement(
  userId: string,
  groupId: string,
  settlementId: string,
): Promise<void> {
  const { groupOid } = await assertGroupMember(userId, groupId);
  const settlements = await getSettlementsCollection();
  const settlementOid = new ObjectId(settlementId);

  const settlement = await settlements.findOne({
    _id: settlementOid,
    groupId: groupOid,
    deletedAt: null,
  });
  if (!settlement) throw notFound();
  if (settlement.createdBy.toHexString() !== userId) throw forbidden();

  const now = new Date();
  await settlements.updateOne(
    { _id: settlementOid },
    {
      $set: {
        deletedAt: now,
        updatedAt: now,
        _version: settlement._version + 1,
      },
    },
  );
}
