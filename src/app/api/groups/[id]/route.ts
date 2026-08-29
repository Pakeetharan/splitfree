import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { getGroup, updateGroup, deleteGroup } from "@/lib/services/group.service";
import { updateGroupSchema } from "@/lib/validators/group";
import { getExpensesCollection } from "@/lib/mongodb/collections";
import { serializeDoc } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const group = await getGroup(user.id, id);
    const expenses = await getExpensesCollection();
    const hasExpenses = !!(await expenses.findOne({
      groupId: group._id,
      deletedAt: null,
    }));
    return NextResponse.json({ ...serializeDoc(group), hasExpenses });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await request.json();
    const data = updateGroupSchema.parse(body);
    const group = await updateGroup(user.id, id, data);
    return NextResponse.json(serializeDoc(group));
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    await deleteGroup(user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
