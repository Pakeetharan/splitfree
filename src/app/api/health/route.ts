import { getDb } from "@/lib/mongodb/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const res = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anonKey },
    cache: "no-store",
  });
  return res.ok;
}

async function checkMongo(): Promise<boolean> {
  const db = await getDb();
  const result = await db.command({ ping: 1 });
  return result.ok === 1;
}

export async function GET() {
  const [supabase, mongo] = await Promise.allSettled([
    checkSupabase(),
    checkMongo(),
  ]);

  const supabaseOk = supabase.status === "fulfilled" && supabase.value;
  const mongoOk = mongo.status === "fulfilled" && mongo.value;

  const body = {
    status: supabaseOk && mongoOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      supabase: supabaseOk
        ? "ok"
        : `error: ${supabase.status === "rejected" ? supabase.reason : "unhealthy"}`,
      mongodb: mongoOk
        ? "ok"
        : `error: ${mongo.status === "rejected" ? mongo.reason : "unhealthy"}`,
    },
  };

  return Response.json(body, { status: supabaseOk && mongoOk ? 200 : 503 });
}
