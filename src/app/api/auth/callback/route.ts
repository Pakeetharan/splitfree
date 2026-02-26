import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsersCollection, getMembersCollection } from "@/lib/mongodb/collections";
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

  const supabaseUser = data.user;

  // Upsert user in MongoDB
  try {
    const users = await getUsersCollection();
    const now = new Date();

    await users.updateOne(
      { supabaseId: supabaseUser.id },
      {
        $set: {
          email: supabaseUser.email ?? "",
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.email?.split("@")[0] ??
            "User",
          avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
          updatedAt: now,
          deletedAt: null,
        },
        $setOnInsert: {
          supabaseId: supabaseUser.id,
          createdAt: now,
        },
        $inc: { _version: 1 },
      },
      { upsert: true }
    );

    // Auto-link virtual members with matching email
    if (supabaseUser.email) {
      const user = await users.findOne({ supabaseId: supabaseUser.id });
      if (user) {
        const members = await getMembersCollection();
        const result = await members.updateMany(
          {
            email: supabaseUser.email,
            userId: null,
            deletedAt: null,
          },
          {
            $set: {
              userId: user._id,
              isVirtual: false,
              updatedAt: now,
            },
            $inc: { _version: 1 },
          }
        );

        if (result.modifiedCount > 0) {
          console.log(
            `Auto-linked ${result.modifiedCount} virtual member(s) for ${supabaseUser.email}`
          );
        }
      }
    }
  } catch (err) {
    console.error("User upsert/auto-link error:", err);
    // Don't block login — user can still proceed
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
