import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ArrowRight, Users, WifiOff, Zap, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/user-menu";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="SplitFree"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-dark.svg"
              alt="SplitFree"
              className="hidden h-8 w-auto dark:block"
            />
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <UserMenu />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Split expenses,
            <br />
            <span className="text-blue-600">not friendships</span>
          </h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            {APP_DESCRIPTION}. Works offline, syncs when you&apos;re back
            online. No sign-up required for group members.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <LoginButton />
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-20 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Users className="h-6 w-6" />}
            title="Virtual Members"
            desc="Add friends who don't have an account yet"
            color="blue"
          />
          <Feature
            icon={<WifiOff className="h-6 w-6" />}
            title="Offline First"
            desc="Works without internet, syncs when connected"
            color="green"
          />
          <Feature
            icon={<Zap className="h-6 w-6" />}
            title="Smart Settlements"
            desc="Optimized minimal transfers to settle debts"
            color="purple"
          />
          <Feature
            icon={<Download className="h-6 w-6" />}
            title="Export & Share"
            desc="Excel export and public shareable dashboards"
            color="orange"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {APP_NAME} is open source.
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
  };
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg[color]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}
