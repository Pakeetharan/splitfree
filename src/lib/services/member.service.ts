import { ObjectId } from "mongodb";
import {
  getMembersCollection,
  getGroupsCollection,
  getUsersCollection,
} from "@/lib/mongodb/collections";
import type { AddMemberInput, UpdateMemberInput } from "@/lib/validators/member";
import type { DbMember } from "@/types/database";

// ─── Helpers ─────────────────────────────────────────────

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

/**
 * Verify that the user is a member of the group.
 * Returns the member document or throws a 403/404 Response.
 */
async function assertGroupMember(
  userId: string,
  groupId: string,
): Promise<void> {
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
}

/**
 * Verify that the user is the group creator (owner).
 */
async function assertGroupOwner(userId: string, groupId: string): Promise<void> {
  const groups = await getGroupsCollection();
  const groupOid = new ObjectId(groupId);
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  if (!group) throw notFound();
  if (group.createdBy.toHexString() !== userId) throw forbidden();
}

// ─── List Members ─────────────────────────────────────────

export async function listMembers(
  userId: string,
  groupId: string,
): Promise<DbMember[]> {
  await assertGroupMember(userId, groupId);

  const members = await getMembersCollection();
  const users = await getUsersCollection();
  const groupOid = new ObjectId(groupId);

  const memberDocs = await members
    .find({ groupId: groupOid, deletedAt: null })
    .sort({ createdAt: 1 })
    .toArray();

  // Enrich with user names for non-virtual members
  const userIds = memberDocs
    .filter((m) => m.userId !== null)
    .map((m) => m.userId!);

  const userDocs =
    userIds.length > 0
      ? await users
          .find({ _id: { $in: userIds }, deletedAt: null })
          .toArray()
      : [];

  const userMap = new Map(userDocs.map((u) => [u._id.toHexString(), u]));

  return memberDocs.map((m) => {
    if (m.userId) {
      const user = userMap.get(m.userId.toHexString());
      if (user) {
        return { ...m, name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null };
      }
    }
    return m;
  });
}

// ─── Add Member ──────────────────────────────────────────

export async function addMember(
  userId: string,
  groupId: string,
  data: AddMemberInput,
): Promise<DbMember> {
  await assertGroupOwner(userId, groupId);

  const members = await getMembersCollection();
  const users = await getUsersCollection();
  const groupOid = new ObjectId(groupId);

  // Check if a registered user with this email already exists
  let linkedUserId: ObjectId | null = null;
  let isVirtual = true;

  if (data.email) {
    const existingUser = await users.findOne({
      email: data.email.toLowerCase(),
      deletedAt: null,
    });
    if (existingUser) {
      linkedUserId = existingUser._id;
      isVirtual = false;

      // Check if this user is already a member
      const existing = await members.findOne({
        groupId: groupOid,
        userId: linkedUserId,
        deletedAt: null,
      });
      if (existing) {
        throw new Response(
          JSON.stringify({ error: "User is already a member of this group" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  const now = new Date();
  const member: DbMember = {
    _id: new ObjectId(),
    groupId: groupOid,
    userId: linkedUserId,
    name: data.name,
    email: data.email?.toLowerCase() ?? null,
    role: "member",
    isVirtual,
    createdAt: now,
    updatedAt: now,
    _version: 1,
    deletedAt: null,
  };

  await members.insertOne(member);
  return member;
}

// ─── Update Member ───────────────────────────────────────

export async function updateMember(
  userId: string,
  groupId: string,
  memberId: string,
  data: UpdateMemberInput,
): Promise<DbMember> {
  await assertGroupOwner(userId, groupId);

  const members = await getMembersCollection();
  const groupOid = new ObjectId(groupId);
  const memberOid = new ObjectId(memberId);

  const member = await members.findOne({
    _id: memberOid,
    groupId: groupOid,
    deletedAt: null,
  });
  if (!member) throw notFound();

  // If the member is linked to a registered user, email is immutable
  if (data.email !== undefined && !member.isVirtual) {
    throw new Response(
      JSON.stringify({ error: "Cannot change email for a linked member" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date();
  const updateFields: Partial<DbMember> = {
    updatedAt: now,
    _version: member._version + 1,
  };

  if (data.name !== undefined) updateFields.name = data.name;

  // Handle email update — may link a virtual member to a registered user
  if (data.email !== undefined) {
    const email = data.email.toLowerCase();
    updateFields.email = email;

    // Check if this email belongs to a registered user
    const users = await getUsersCollection();
    const existingUser = await users.findOne({ email, deletedAt: null });
    if (existingUser) {
      // Ensure this user is not already a member of the group
      const duplicate = await members.findOne({
        groupId: groupOid,
        userId: existingUser._id,
        _id: { $ne: memberOid },
        deletedAt: null,
      });
      if (duplicate) {
        throw new Response(
          JSON.stringify({ error: "User is already a member of this group" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      updateFields.userId = existingUser._id;
      updateFields.isVirtual = false;
    }
  }

  await members.updateOne({ _id: memberOid }, { $set: updateFields });
  return { ...member, ...updateFields };
}

// ─── Remove Member ───────────────────────────────────────

export async function removeMember(
  userId: string,
  groupId: string,
  memberId: string,
): Promise<void> {
  await assertGroupOwner(userId, groupId);

  const members = await getMembersCollection();
  const groupOid = new ObjectId(groupId);
  const memberOid = new ObjectId(memberId);

  const member = await members.findOne({
    _id: memberOid,
    groupId: groupOid,
    deletedAt: null,
  });
  if (!member) throw notFound();

  // Don't allow removing self (owner)
  if (member.userId?.toHexString() === userId) {
    throw new Response(
      JSON.stringify({ error: "Cannot remove yourself from the group" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date();
  await members.updateOne(
    { _id: memberOid },
    { $set: { deletedAt: now, updatedAt: now, _version: member._version + 1 } },
  );
}
