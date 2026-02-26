import { ObjectId } from "mongodb";
import {
  getGroupsCollection,
  getMembersCollection,
} from "@/lib/mongodb/collections";
import type { CreateGroupInput, UpdateGroupInput } from "@/lib/validators/group";
import type { DbGroup } from "@/types/database";

// ─── Helpers ─────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

// ─── Create Group ────────────────────────────────────────

export async function createGroup(
  userId: string,
  data: CreateGroupInput,
  ownerName?: string,
  ownerEmail?: string,
): Promise<DbGroup> {
  const groups = await getGroupsCollection();
  const members = await getMembersCollection();
  const now = new Date();
  const userOid = new ObjectId(userId);

  const group: DbGroup = {
    _id: new ObjectId(),
    name: data.name,
    description: data.description ?? null,
    currency: data.currency,
    createdBy: userOid,
    createdAt: now,
    updatedAt: now,
    _version: 1,
    deletedAt: null,
  };

  await groups.insertOne(group);

  // Add the creator as the owner member
  await members.insertOne({
    _id: new ObjectId(),
    groupId: group._id,
    userId: userOid,
    name: ownerName ?? "", // Stored as fallback; always overridden by listMembers enrichment
    email: ownerEmail?.toLowerCase() ?? null,
    role: "owner",
    isVirtual: false,
    createdAt: now,
    updatedAt: now,
    _version: 1,
    deletedAt: null,
  });

  return group;
}

// ─── List Groups ─────────────────────────────────────────

export interface GroupListItem extends DbGroup {
  memberCount: number;
  expenseCount: number;
}

export async function listGroups(userId: string): Promise<GroupListItem[]> {
  const members = await getMembersCollection();
  const groups = await getGroupsCollection();
  const userOid = new ObjectId(userId);

  // Find all memberships for this user that are not soft-deleted
  const memberDocs = await members
    .find({ userId: userOid, deletedAt: null })
    .toArray();

  if (memberDocs.length === 0) {
    return [];
  }

  const groupIds = memberDocs.map((m) => m.groupId);

  // Fetch the groups
  const groupDocs = await groups
    .find({ _id: { $in: groupIds }, deletedAt: null })
    .toArray();

  if (groupDocs.length === 0) {
    return [];
  }

  // Count members per group
  const memberCounts = await members
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { groupId: { $in: groupIds }, deletedAt: null } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ])
    .toArray();

  const memberCountMap = new Map(
    memberCounts.map((mc) => [mc._id.toHexString(), mc.count]),
  );

  return groupDocs.map((g) => ({
    ...g,
    memberCount: memberCountMap.get(g._id.toHexString()) ?? 0,
    expenseCount: 0, // TODO: implement expense counting
  }));
}

// ─── Get Group ───────────────────────────────────────────

export async function getGroup(
  userId: string,
  groupId: string,
): Promise<DbGroup> {
  const groups = await getGroupsCollection();
  const members = await getMembersCollection();
  const groupOid = new ObjectId(groupId);
  const userOid = new ObjectId(userId);

  const group = await groups.findOne({ _id: groupOid, deletedAt: null });

  if (!group) {
    throw errorResponse("Group not found", 404);
  }

  // Verify the user is a member of this group
  const membership = await members.findOne({
    groupId: groupOid,
    userId: userOid,
    deletedAt: null,
  });

  if (!membership) {
    throw errorResponse("You do not have access to this group", 403);
  }

  return group;
}

// ─── Update Group ────────────────────────────────────────

export async function updateGroup(
  userId: string,
  groupId: string,
  data: UpdateGroupInput,
): Promise<DbGroup> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const userOid = new ObjectId(userId);

  const group = await groups.findOne({ _id: groupOid, deletedAt: null });

  if (!group) {
    throw errorResponse("Group not found", 404);
  }

  // Only the creator can update
  if (!group.createdBy.equals(userOid)) {
    throw errorResponse("Only the group creator can update this group", 403);
  }

  // Optimistic concurrency check
  if (group._version !== data._version) {
    throw errorResponse(
      "Group has been modified by another user. Please refresh and try again.",
      409,
    );
  }

  const { _version, ...updateFields } = data;
  const $set: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updateFields.name !== undefined) $set.name = updateFields.name;
  if (updateFields.description !== undefined)
    $set.description = updateFields.description;
  if (updateFields.currency !== undefined)
    $set.currency = updateFields.currency;

  const result = await groups.findOneAndUpdate(
    { _id: groupOid, _version: data._version },
    { $set, $inc: { _version: 1 } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw errorResponse(
      "Group has been modified by another user. Please refresh and try again.",
      409,
    );
  }

  return result;
}

// ─── Delete Group (Soft Delete) ──────────────────────────

export async function deleteGroup(
  userId: string,
  groupId: string,
): Promise<void> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const userOid = new ObjectId(userId);

  const group = await groups.findOne({ _id: groupOid, deletedAt: null });

  if (!group) {
    throw errorResponse("Group not found", 404);
  }

  // Only the creator can delete
  if (!group.createdBy.equals(userOid)) {
    throw errorResponse("Only the group creator can delete this group", 403);
  }

  await groups.updateOne(
    { _id: groupOid },
    { $set: { deletedAt: new Date(), updatedAt: new Date() } },
  );
}
