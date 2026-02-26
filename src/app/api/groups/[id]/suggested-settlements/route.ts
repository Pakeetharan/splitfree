import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { computeBalances } from "@/lib/engine/balance-calculator";
import { computeOptimalSettlements } from "@/lib/engine/settlement-optimizer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const balances = await computeBalances(user.id, id);
    const suggestions = computeOptimalSettlements(balances);
    return NextResponse.json(suggestions);
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
