import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/auth/login-button";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Sign In — ${APP_NAME}`,
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo.svg"
            alt="SplitFree"
            className="h-10 w-auto dark:hidden"
          />
          <img
            src="/logo-dark.svg"
            alt="SplitFree"
            className="hidden h-10 w-auto dark:block"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your shared expenses
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <LoginButton />
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
