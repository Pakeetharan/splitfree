import { ObjectId } from "mongodb";
import {
  getExpensesCollection,
  getGroupsCollection,
  getMembersCollection,
} from "@/lib/mongodb/collections";
import {
  baseSplitAmount,
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateExactSplit,
  validatePercentageSplit,
  validateSharesSplit,
  type SplitValueInput,
} from "@/lib/engine/split-calculator";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/lib/validators/expense";
import type { DbExpense, SplitDetail, SplitType, SplitValue } from "@/types/database";

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Resolve splitType/splitValues/splitDetails for an expense, validating
 * non-equal splitValues server-side (never trust client-computed cents).
 * `splitAmongIds` and any `splitValues` are hex-string member ids.
 */
function resolveSplit(
  splitType: SplitType,
  splitValuesInput: SplitValueInput[] | undefined,
  splitAmongIds: string[],
  amount: number,
): { splitType: SplitType; splitValues: SplitValue[] | null; splitDetails: SplitDetail[] } {
  if (splitType === "equal") {
    const results = calculateEqualSplit(amount, splitAmongIds);
    return {
      splitType,
      splitValues: null,
      splitDetails: results.map((r) => ({
        memberId: new ObjectId(r.memberId),
        amount: r.amountCents,
      })),
    };
  }

  if (!splitValuesInput || splitValuesInput.length === 0) {
    throw badRequest("splitValues is required for non-equal split types");
  }

  const splitAmongSet = new Set(splitAmongIds);
  const valueIdSet = new Set(splitValuesInput.map((v) => v.memberId));
  if (
    valueIdSet.size !== splitAmongSet.size ||
    ![...splitAmongSet].every((id) => valueIdSet.has(id))
  ) {
    throw badRequest("splitValues must have exactly one entry per member in splitAmong");
  }

  const error =
    splitType === "exact"
      ? validateExactSplit(amount, splitValuesInput)
      : splitType === "percentage"
        ? validatePercentageSplit(splitValuesInput)
        : validateSharesSplit(splitValuesInput);
  if (error) throw badRequest(error);

  const results =
    splitType === "exact"
      ? calculateExactSplit(amount, splitValuesInput)
      : splitType === "percentage"
        ? calculatePercentageSplit(amount, splitValuesInput)
        : calculateSharesSplit(amount, splitValuesInput);

  return {
    splitType,
    splitValues: splitValuesInput.map((v) => ({
      memberId: new ObjectId(v.memberId),
      value: v.value,
    })),
    splitDetails: results.map((r) => ({
      memberId: new ObjectId(r.memberId),
      amount: r.amountCents,
    })),
  };
}

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

export type ExpenseSortOrder =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc";

export interface ExpenseListOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: ExpenseSortOrder;
}

export interface ExpenseListResult {
  expenses: DbExpense[];
  total: number;
  page: number;
  limit: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORT_SPECS: Record<
  ExpenseSortOrder,
  Record<string, 1 | -1>
> = {
  date_desc: { date: -1, createdAt: -1 },
  date_asc: { date: 1, createdAt: 1 },
  amount_desc: { amount: -1, date: -1 },
  amount_asc: { amount: 1, date: -1 },
};

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

  const filter: Record<string, unknown> = {
    groupId: groupOid,
    deletedAt: null,
  };

  if (options.search?.trim()) {
    filter.description = {
      $regex: escapeRegExp(options.search.trim()),
      $options: "i",
    };
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.memberId) {
    const memberOid = new ObjectId(options.memberId);
    filter.$or = [{ paidBy: memberOid }, { splitAmong: memberOid }];
  }

  if (options.dateFrom || options.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (options.dateFrom) dateFilter.$gte = new Date(options.dateFrom);
    if (options.dateTo) dateFilter.$lte = new Date(options.dateTo);
    filter.date = dateFilter;
  }

  const sort = SORT_SPECS[options.sort ?? "date_desc"];

  const [total, docs] = await Promise.all([
    expenses.countDocuments(filter),
    expenses.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
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
  const { splitType, splitValues, splitDetails } = resolveSplit(
    data.splitType ?? "equal",
    data.splitValues,
    data.splitAmong,
    data.amount,
  );

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
    splitType,
    splitValues,
    splitDetails,
    category: data.category ?? null,
    notes: data.notes ?? null,
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

  // Only the expense creator or the group owner can edit
  const groups = await getGroupsCollection();
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  const isCreator = expense.createdBy.toHexString() === userId;
  const isGroupOwner = group?.createdBy.toHexString() === userId;
  if (!isCreator && !isGroupOwner) throw forbidden();

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
  if (data.notes !== undefined) updateFields.notes = data.notes || null;
  if (data.date !== undefined) updateFields.date = new Date(data.date);

  const newAmount = data.amount ?? expense.amount;
  const newSplitAmong = data.splitAmong
    ? data.splitAmong.map((id) => new ObjectId(id))
    : expense.splitAmong;
  const newSplitAmongIds = newSplitAmong.map((id) => id.toHexString());

  if (data.amount !== undefined) updateFields.amount = newAmount;
  if (data.paidBy !== undefined) updateFields.paidBy = new ObjectId(data.paidBy);
  if (data.splitAmong !== undefined) updateFields.splitAmong = newSplitAmong;

  updateFields.splitAmount = baseSplitAmount(newAmount, newSplitAmong.length);

  // Recompute the split whenever anything that affects it changes. If
  // splitType/splitValues aren't in this patch but the expense is already a
  // non-equal split, reuse its existing raw values — unless splitAmong is
  // changing too, in which case the caller must supply new splitValues
  // (the old ones can't be assumed to match the new member set).
  const effectiveSplitType: SplitType = data.splitType ?? expense.splitType ?? "equal";
  let effectiveSplitValuesInput: SplitValueInput[] | undefined = data.splitValues;
  if (
    effectiveSplitType !== "equal" &&
    !effectiveSplitValuesInput &&
    expense.splitValues &&
    !data.splitAmong
  ) {
    effectiveSplitValuesInput = expense.splitValues.map((v) => ({
      memberId: v.memberId.toHexString(),
      value: v.value,
    }));
  }

  if (
    data.amount !== undefined ||
    data.splitAmong !== undefined ||
    data.splitType !== undefined ||
    data.splitValues !== undefined
  ) {
    const { splitType, splitValues, splitDetails } = resolveSplit(
      effectiveSplitType,
      effectiveSplitValuesInput,
      newSplitAmongIds,
      newAmount,
    );
    updateFields.splitType = splitType;
    updateFields.splitValues = splitValues;
    updateFields.splitDetails = splitDetails;
  }

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

  // Only the expense creator or the group owner can delete
  const groups = await getGroupsCollection();
  const group = await groups.findOne({ _id: groupOid, deletedAt: null });
  const isCreator = expense.createdBy.toHexString() === userId;
  const isGroupOwner = group?.createdBy.toHexString() === userId;
  if (!isCreator && !isGroupOwner) throw forbidden();

  const now = new Date();
  await expenses.updateOne(
    { _id: expenseOid },
    { $set: { deletedAt: now, updatedAt: now, _version: expense._version + 1 } },
  );
}
