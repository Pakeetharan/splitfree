import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { deleteSettlement } from "@/lib/services/settlement.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; settlementId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, settlementId } = await params;
    await deleteSettlement(user.id, id, settlementId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
