import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { computeBalances } from "@/lib/engine/balance-calculator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const balances = await computeBalances(user.id, id);
    return NextResponse.json(balances);
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
