import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import {
  createShareToken,
  listShareTokens,
} from "@/lib/services/share.service";
import { createShareTokenSchema } from "@/lib/validators/share";
import { serializeDoc } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const tokens = await listShareTokens(user.id, id);
    return NextResponse.json(tokens.map(serializeDoc));
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
    const body = await request.json().catch(() => ({}));
    const data = createShareTokenSchema.parse(body);
    const token = await createShareToken(user.id, id, data);
    return NextResponse.json(serializeDoc(token), { status: 201 });
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
