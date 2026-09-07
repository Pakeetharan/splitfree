import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserFromSupabase } from "@/lib/mongodb/sync-user";
import { AUTH_REDIRECT_PATH } from "@/lib/constants";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? AUTH_REDIRECT_PATH;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    );
  }

  await syncUserFromSupabase(data.user);

  return NextResponse.redirect(new URL(redirectTo, origin));
}
