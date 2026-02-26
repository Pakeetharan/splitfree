import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import {
  listSettlements,
  createSettlement,
} from "@/lib/services/settlement.service";
import { createSettlementSchema } from "@/lib/validators/settlement";
import { serializeDoc } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const settlements = await listSettlements(user.id, id);
    return NextResponse.json(settlements.map(serializeDoc));
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
    const data = createSettlementSchema.parse(body);
    const settlement = await createSettlement(user.id, id, data);
    return NextResponse.json(serializeDoc(settlement), { status: 201 });
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
