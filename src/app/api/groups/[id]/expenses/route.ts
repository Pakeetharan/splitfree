import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { listExpenses, createExpense } from "@/lib/services/expense.service";
import { createExpenseSchema } from "@/lib/validators/expense";
import { serializeDoc } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

    const result = await listExpenses(user.id, id, { page, limit });
    return NextResponse.json({
      data: result.expenses.map(serializeDoc),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await request.json();
    const data = createExpenseSchema.parse(body);
    const expense = await createExpense(user.id, id, data);
    return NextResponse.json(serializeDoc(expense), { status: 201 });
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
