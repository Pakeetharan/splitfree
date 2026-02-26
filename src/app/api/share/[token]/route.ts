import { NextRequest, NextResponse } from "next/server";
import { getPublicShareData } from "@/lib/services/share.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const data = await getPublicShareData(token);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
