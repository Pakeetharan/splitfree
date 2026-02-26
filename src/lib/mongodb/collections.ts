import { Db, Collection } from "mongodb";
import clientPromise from "./client";
import type {
  DbUser,
  DbGroup,
  DbMember,
  DbExpense,
  DbSettlement,
  DbShareToken,
} from "@/types/database";

const DB_NAME = process.env.MONGODB_DB_NAME ?? "splitfree";

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getUsersCollection(): Promise<Collection<DbUser>> {
  const db = await getDb();
  return db.collection<DbUser>("users");
}

export async function getGroupsCollection(): Promise<Collection<DbGroup>> {
  const db = await getDb();
  return db.collection<DbGroup>("groups");
}

export async function getMembersCollection(): Promise<Collection<DbMember>> {
  const db = await getDb();
  return db.collection<DbMember>("members");
}

export async function getExpensesCollection(): Promise<Collection<DbExpense>> {
  const db = await getDb();
  return db.collection<DbExpense>("expenses");
}

export async function getSettlementsCollection(): Promise<
  Collection<DbSettlement>
> {
  const db = await getDb();
  return db.collection<DbSettlement>("settlements");
}

export async function getShareTokensCollection(): Promise<
  Collection<DbShareToken>
> {
  const db = await getDb();
  return db.collection<DbShareToken>("shareTokens");
}

/**
 * Ensure all indexes are created. Call once on app startup or as part of a setup script.
 */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  // users
  const users = db.collection("users");
  await users.createIndex({ supabaseId: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });

  // groups
  const groups = db.collection("groups");
  await groups.createIndex({ createdBy: 1, deletedAt: 1 });

  // members
  const members = db.collection("members");
  await members.createIndex({ groupId: 1, deletedAt: 1 });
  await members.createIndex({ userId: 1, deletedAt: 1 });
  await members.createIndex({ email: 1, userId: 1 });
  await members.createIndex(
    { groupId: 1, userId: 1 },
    { unique: true, sparse: true }
  );

  // expenses
  const expenses = db.collection("expenses");
  await expenses.createIndex({ groupId: 1, deletedAt: 1, date: -1 });
  await expenses.createIndex({ groupId: 1, paidBy: 1, deletedAt: 1 });
  await expenses.createIndex({ _tempId: 1 }, { sparse: true });

  // settlements
  const settlements = db.collection("settlements");
  await settlements.createIndex({ groupId: 1, deletedAt: 1, date: -1 });
  await settlements.createIndex({ _tempId: 1 }, { sparse: true });

  // shareTokens
  const shareTokens = db.collection("shareTokens");
  await shareTokens.createIndex({ token: 1 }, { unique: true });
  await shareTokens.createIndex({ groupId: 1 });
  await shareTokens.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, sparse: true }
  );
}
