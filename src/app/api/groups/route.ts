import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { createGroup, listGroups } from "@/lib/services/group.service";
import { createGroupSchema } from "@/lib/validators/group";
import { serializeDoc } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getAuthUser();
    const groups = await listGroups(user.id);
    return NextResponse.json(groups.map(serializeDoc));
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const data = createGroupSchema.parse(body);
    const group = await createGroup(user.id, data, user.name, user.email);
    return NextResponse.json(serializeDoc(group), { status: 201 });
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
