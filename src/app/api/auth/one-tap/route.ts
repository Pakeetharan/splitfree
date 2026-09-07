import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserFromSupabase } from "@/lib/mongodb/sync-user";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const credential = body?.credential;

  if (typeof credential !== "string" || !credential) {
    return NextResponse.json({ error: "missing_credential" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error || !data.user) {
    console.error("One Tap sign-in error:", error);
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }

  await syncUserFromSupabase(data.user);

  return NextResponse.json({ ok: true });
}
