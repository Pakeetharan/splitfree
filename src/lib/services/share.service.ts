import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import {
  getShareTokensCollection,
  getGroupsCollection,
  getMembersCollection,
  getExpensesCollection,
  getSettlementsCollection,
  getUsersCollection,
} from "@/lib/mongodb/collections";
import type { CreateShareTokenInput } from "@/lib/validators/share";
import type { DbShareToken } from "@/types/database";
import { serializeDoc } from "@/lib/utils";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

function notFound(msg = "Not found"): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Create Share Token ───────────────────────────────────

export async function createShareToken(
  userId: string,
  groupId: string,
  data: CreateShareTokenInput,
): Promise<DbShareToken> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) throw notFound();
  if (group.createdBy.toHexString() !== userId) throw forbidden();

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + data.expiresInHours * 60 * 60 * 1000,
  );

  const shareToken: DbShareToken = {
    _id: new ObjectId(),
    token: randomUUID(),
    groupId: groupOid,
    createdBy: new ObjectId(userId),
    expiresAt,
    createdAt: now,
    isRevoked: false,
  };

  const tokens = await getShareTokensCollection();
  await tokens.insertOne(shareToken);
  return shareToken;
}

// ─── Revoke Share Token ───────────────────────────────────

export async function revokeShareToken(
  userId: string,
  groupId: string,
  tokenId: string,
): Promise<void> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) throw notFound();
  if (group.createdBy.toHexString() !== userId) throw forbidden();

  const tokens = await getShareTokensCollection();
  const result = await tokens.updateOne(
    { _id: new ObjectId(tokenId), groupId: groupOid },
    { $set: { isRevoked: true } },
  );

  if (result.matchedCount === 0) throw notFound("Share token not found");
}

// ─── Get Public Share Data ────────────────────────────────

export interface PublicShareData {
  group: Record<string, unknown>;
  members: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  settlements: Record<string, unknown>[];
  expiresAt: string;
}

export async function getPublicShareData(token: string): Promise<PublicShareData> {
  const tokens = await getShareTokensCollection();
  const shareToken = await tokens.findOne({ token });

  if (!shareToken) throw notFound("Share link not found");
  if (shareToken.isRevoked) throw notFound("This share link has been revoked");
  if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
    throw new Response(JSON.stringify({ error: "This share link has expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const groups = await getGroupsCollection();
  const group = await groups.findOne({
    _id: shareToken.groupId,
    deletedAt: null,
  });
  if (!group) throw notFound("Group not found");

  const members = await getMembersCollection();
  const expenses = await getExpensesCollection();
  const settlements = await getSettlementsCollection();
  const users = await getUsersCollection();

  const [memberDocs, expenseDocs, settlementDocs] = await Promise.all([
    members.find({ groupId: shareToken.groupId, deletedAt: null }).toArray(),
    expenses
      .find({ groupId: shareToken.groupId, deletedAt: null })
      .sort({ date: -1 })
      .limit(100)
      .toArray(),
    settlements
      .find({ groupId: shareToken.groupId, deletedAt: null })
      .sort({ date: -1 })
      .toArray(),
  ]);

  // Enrich members with user profile names and avatars (same logic as listMembers)
  const linkedUserIds = memberDocs
    .filter((m) => m.userId !== null)
    .map((m) => m.userId!);

  const userDocs =
    linkedUserIds.length > 0
      ? await users
          .find({ _id: { $in: linkedUserIds }, deletedAt: null })
          .toArray()
      : [];

  const userMap = new Map(userDocs.map((u) => [u._id.toHexString(), u]));

  const enrichedMembers = memberDocs.map((m) => {
    if (m.userId) {
      const user = userMap.get(m.userId.toHexString());
      if (user) {
        return { ...m, name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null };
      }
    }
    return m;
  });

  return {
    group: serializeDoc(group),
    members: enrichedMembers.map(serializeDoc),
    expenses: expenseDocs.map(serializeDoc),
    settlements: settlementDocs.map(serializeDoc),
    expiresAt: shareToken.expiresAt?.toISOString() ?? "",
  };
}

// ─── List Share Tokens ────────────────────────────────────

export async function listShareTokens(
  userId: string,
  groupId: string,
): Promise<DbShareToken[]> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) throw notFound();
  if (group.createdBy.toHexString() !== userId) throw forbidden();

  const tokens = await getShareTokensCollection();
  return tokens
    .find({ groupId: groupOid, isRevoked: false })
    .sort({ createdAt: -1 })
    .toArray();
}
