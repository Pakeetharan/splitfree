import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { revokeShareToken } from "@/lib/services/share.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, tokenId } = await params;
    await revokeShareToken(user.id, id, tokenId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
