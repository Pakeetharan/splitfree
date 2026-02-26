import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import {
  getGroupsCollection,
  getMembersCollection,
  getExpensesCollection,
  getSettlementsCollection,
} from "@/lib/mongodb/collections";

interface SyncOperation {
  tempId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entity: "group" | "member" | "expense" | "settlement";
  entityId: string;
  groupId: string;
  payload: Record<string, unknown>;
}

interface SyncResult {
  applied: string[];
  failed: { tempId: string; error: string }[];
  serverTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const { operations }: { operations: SyncOperation[] } = body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ applied: [], failed: [], serverTime: new Date().toISOString() });
    }

    const result: SyncResult = {
      applied: [],
      failed: [],
      serverTime: new Date().toISOString(),
    };

    for (const op of operations) {
      try {
        await applyOperation(user.id, op);
        result.applied.push(op.tempId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        result.failed.push({ tempId: op.tempId, error: message });
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function applyOperation(userId: string, op: SyncOperation): Promise<void> {
  const now = new Date();

  switch (op.entity) {
    case "expense": {
      const expenses = await getExpensesCollection();
      const groupId = new ObjectId(op.groupId);
      const expenseId = new ObjectId(op.entityId);

      if (op.operation === "CREATE") {
        const p = op.payload;
        await expenses.updateOne(
          { _id: expenseId },
          {
            $setOnInsert: {
              _id: expenseId,
              groupId,
              description: String(p.description ?? ""),
              amount: Number(p.amount ?? 0),
              currency: String(p.currency ?? "USD"),
              paidBy: new ObjectId(String(p.paidBy)),
              splitAmong: (p.splitAmong as string[]).map((id) => new ObjectId(id)),
              splitAmount: Number(p.splitAmount ?? 0),
              category: p.category ? String(p.category) : null,
              date: new Date(String(p.date)),
              createdBy: new ObjectId(userId),
              createdAt: now,
              updatedAt: now,
              _version: 1,
              deletedAt: null,
              _tempId: op.tempId,
            },
          },
          { upsert: true },
        );
      } else if (op.operation === "DELETE") {
        await expenses.updateOne(
          { _id: expenseId, groupId, createdBy: new ObjectId(userId) },
          { $set: { deletedAt: now, updatedAt: now } },
        );
      }
      break;
    }

    case "settlement": {
      const settlements = await getSettlementsCollection();
      const groupId = new ObjectId(op.groupId);
      const settlementId = new ObjectId(op.entityId);

      if (op.operation === "CREATE") {
        const p = op.payload;
        await settlements.updateOne(
          { _id: settlementId },
          {
            $setOnInsert: {
              _id: settlementId,
              groupId,
              payer: new ObjectId(String(p.payer)),
              payee: new ObjectId(String(p.payee)),
              amount: Number(p.amount ?? 0),
              note: p.note ? String(p.note) : null,
              date: new Date(String(p.date)),
              createdBy: new ObjectId(userId),
              createdAt: now,
              updatedAt: now,
              _version: 1,
              deletedAt: null,
              _tempId: op.tempId,
            },
          },
          { upsert: true },
        );
      } else if (op.operation === "DELETE") {
        await settlements.updateOne(
          { _id: settlementId, groupId, createdBy: new ObjectId(userId) },
          { $set: { deletedAt: now, updatedAt: now } },
        );
      }
      break;
    }

    default:
      throw new Error(`Unsupported entity: ${op.entity}`);
  }
}
