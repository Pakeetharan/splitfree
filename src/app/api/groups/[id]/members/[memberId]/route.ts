import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { updateMember, removeMember } from "@/lib/services/member.service";
import { updateMemberSchema } from "@/lib/validators/member";
import { serializeDoc } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, memberId } = await params;
    const body = await request.json();
    const data = updateMemberSchema.parse(body);
    const member = await updateMember(user.id, id, memberId, data);
    return NextResponse.json(serializeDoc(member));
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
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id, memberId } = await params;
    await removeMember(user.id, id, memberId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
