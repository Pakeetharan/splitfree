import type { User } from "@supabase/supabase-js";
import { getUsersCollection, getMembersCollection } from "./collections";

/**
 * Upserts a Supabase-authenticated user into MongoDB and auto-links any
 * virtual members that share their email. Shared by every auth entry point
 * (OAuth redirect callback, Google One Tap) so they stay in sync.
 */
export async function syncUserFromSupabase(supabaseUser: User): Promise<void> {
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
}
