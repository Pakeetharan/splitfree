import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/mongodb/collections";
import { LOGIN_PATH } from "@/lib/constants";
import type { AuthUser } from "@/types/api";

/**
 * Resolve the authenticated user from proxy headers + MongoDB.
 * If the Supabase session exists but the MongoDB user doesn't (e.g. upsert race),
 * auto-create the user record so the auth flow is self-healing.
 * Returns the AuthUser or null if not authenticated.
 */
async function resolveAuthUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  const supabaseId = headersList.get("x-user-id");
  const email = headersList.get("x-user-email");

  if (!supabaseId || !email) {
    return null;
  }

  const users = await getUsersCollection();
  let user = await users.findOne({
    supabaseId,
    deletedAt: null,
  });

  // Self-healing: if Supabase session is valid but MongoDB user is missing,
  // create the record now (handles callback upsert failures / race conditions).
  if (!user) {
    const name = headersList.get("x-user-name") || email.split("@")[0] || "User";
    const avatarUrl = headersList.get("x-user-avatar") || null;
    const now = new Date();

    try {
      await users.updateOne(
        { supabaseId },
        {
          $set: {
            email,
            name,
            avatarUrl,
            updatedAt: now,
            deletedAt: null,
          },
          $setOnInsert: {
            supabaseId,
            createdAt: now,
          },
          $inc: { _version: 1 },
        },
        { upsert: true },
      );
      user = await users.findOne({ supabaseId, deletedAt: null });
    } catch (err) {
      console.error("[auth] Self-healing user creation failed:", err);
      return null;
    }
  }

  if (!user) {
    return null;
  }

  return {
    id: user._id.toHexString(),
    supabaseId: user.supabaseId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Get the authenticated user for API route handlers.
 * Throws a Response(401) if user is not authenticated — catch with `if (err instanceof Response)`.
 */
export async function getAuthUser(): Promise<AuthUser> {
  const user = await resolveAuthUser();
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return user;
}

/**
 * Get the authenticated user for Server Component pages.
 * Redirects to /login if user is not authenticated (safe for RSC — uses next/navigation redirect).
 */
export async function getPageAuthUser(): Promise<AuthUser> {
  const user = await resolveAuthUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return user;
}
