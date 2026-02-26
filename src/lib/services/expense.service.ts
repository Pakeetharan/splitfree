import { ObjectId } from "mongodb";
import {
  getExpensesCollection,
  getGroupsCollection,
  getMembersCollection,
} from "@/lib/mongodb/collections";
import { baseSplitAmount } from "@/lib/engine/split-calculator";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/lib/validators/expense";
import type { DbExpense } from "@/types/database";

// ─── Auth helpers ─────────────────────────────────────────

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

async function assertGroupMember(
  userId: string,
  groupId: string,
): Promise<ObjectId> {
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
  return groupOid;
}

// ─── List Expenses ────────────────────────────────────────

export interface ExpenseListOptions {
  page?: number;
  limit?: number;
}

export interface ExpenseListResult {
  expenses: DbExpense[];
  total: number;
  page: number;
  limit: number;
}

export async function listExpenses(
  userId: string,
  groupId: string,
  options: ExpenseListOptions = {},
): Promise<ExpenseListResult> {
  const groupOid = await assertGroupMember(userId, groupId);
  const expenses = await getExpensesCollection();

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter = { groupId: groupOid, deletedAt: null };
  const [total, docs] = await Promise.all([
    expenses.countDocuments(filter),
    expenses
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  return { expenses: docs, total, page, limit };
}

// ─── Get Expense ─────────────────────────────────────────

export async function getExpense(
  userId: string,
  groupId: string,
  expenseId: string,
): Promise<DbExpense> {
  const groupOid = await assertGroupMember(userId, groupId);
  const expenses = await getExpensesCollection();

  const expense = await expenses.findOne({
    _id: new ObjectId(expenseId),
    groupId: groupOid,
    deletedAt: null,
  });
  if (!expense) throw notFound();
  return expense;
}

// ─── Create Expense ───────────────────────────────────────

export async function createExpense(
  userId: string,
  groupId: string,
  data: CreateExpenseInput,
): Promise<DbExpense> {
  const groupOid = await assertGroupMember(userId, groupId);

  // Validate paidBy and splitAmong member IDs belong to this group
  const members = await getMembersCollection();
  const paidByOid = new ObjectId(data.paidBy);
  const splitAmongOids = data.splitAmong.map((id) => new ObjectId(id));

  const allIds = [paidByOid, ...splitAmongOids];
  const memberDocs = await members
    .find({ _id: { $in: allIds }, groupId: groupOid, deletedAt: null })
    .toArray();

  const memberIdSet = new Set(memberDocs.map((m) => m._id.toHexString()));

  if (!memberIdSet.has(data.paidBy)) {
    throw new Response(JSON.stringify({ error: "Payer is not a group member" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const id of data.splitAmong) {
    if (!memberIdSet.has(id)) {
      throw new Response(
        JSON.stringify({ error: `Member ${id} is not in this group` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Get group currency
  const groups = await getGroupsCollection();
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  const currency = group?.currency ?? "USD";

  const splitAmount = baseSplitAmount(data.amount, data.splitAmong.length);

  const now = new Date();
  const expense: DbExpense = {
    _id: new ObjectId(),
    groupId: groupOid,
    description: data.description,
    amount: data.amount,
    currency,
    paidBy: paidByOid,
    splitAmong: splitAmongOids,
    splitAmount,
    category: data.category ?? null,
    date: new Date(data.date),
    createdBy: new ObjectId(userId),
    createdAt: now,
    updatedAt: now,
    _version: 1,
    deletedAt: null,
  };

  const expenses = await getExpensesCollection();
  await expenses.insertOne(expense);
  return expense;
}

// ─── Update Expense ───────────────────────────────────────

export async function updateExpense(
  userId: string,
  groupId: string,
  expenseId: string,
  data: UpdateExpenseInput,
): Promise<DbExpense> {
  const groupOid = await assertGroupMember(userId, groupId);
  const expenses = await getExpensesCollection();
  const expenseOid = new ObjectId(expenseId);

  const expense = await expenses.findOne({
    _id: expenseOid,
    groupId: groupOid,
    deletedAt: null,
  });
  if (!expense) throw notFound();

  // Only the expense creator can edit
  if (expense.createdBy.toHexString() !== userId) throw forbidden();

  // Version check for optimistic concurrency
  if (data._version !== expense._version) {
    throw new Response(JSON.stringify({ error: "Conflict: version mismatch" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const updateFields: Partial<DbExpense> = {
    updatedAt: now,
    _version: expense._version + 1,
  };

  if (data.description !== undefined) updateFields.description = data.description;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.date !== undefined) updateFields.date = new Date(data.date);

  const newAmount = data.amount ?? expense.amount;
  const newSplitAmong = data.splitAmong
    ? data.splitAmong.map((id) => new ObjectId(id))
    : expense.splitAmong;

  if (data.amount !== undefined) updateFields.amount = newAmount;
  if (data.paidBy !== undefined) updateFields.paidBy = new ObjectId(data.paidBy);
  if (data.splitAmong !== undefined) updateFields.splitAmong = newSplitAmong;

  updateFields.splitAmount = baseSplitAmount(newAmount, newSplitAmong.length);

  await expenses.updateOne({ _id: expenseOid }, { $set: updateFields });
  return { ...expense, ...updateFields };
}

// ─── Delete Expense ───────────────────────────────────────

export async function deleteExpense(
  userId: string,
  groupId: string,
  expenseId: string,
): Promise<void> {
  const groupOid = await assertGroupMember(userId, groupId);
  const expenses = await getExpensesCollection();
  const expenseOid = new ObjectId(expenseId);

  const expense = await expenses.findOne({
    _id: expenseOid,
    groupId: groupOid,
    deletedAt: null,
  });
  if (!expense) throw notFound();
  if (expense.createdBy.toHexString() !== userId) throw forbidden();

  const now = new Date();
  await expenses.updateOne(
    { _id: expenseOid },
    { $set: { deletedAt: now, updatedAt: now, _version: expense._version + 1 } },
  );
}
