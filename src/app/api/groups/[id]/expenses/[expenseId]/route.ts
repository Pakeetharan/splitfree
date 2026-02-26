import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import {
  getExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/services/expense.service";
import { updateExpenseSchema } from "@/lib/validators/expense";
import { serializeDoc } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, expenseId } = await params;
    const expense = await getExpense(user.id, id, expenseId);
    return NextResponse.json(serializeDoc(expense));
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, expenseId } = await params;
    const body = await request.json();
    const data = updateExpenseSchema.parse(body);
    const expense = await updateExpense(user.id, id, expenseId, data);
    return NextResponse.json(serializeDoc(expense));
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, expenseId } = await params;
    await deleteExpense(user.id, id, expenseId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
