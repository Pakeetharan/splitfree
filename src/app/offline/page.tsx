import { APP_NAME } from "@/lib/constants";
import { WifiOff } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: `Offline — ${APP_NAME}`,
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
          <WifiOff className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
        <p className="text-gray-500 dark:text-gray-400">
          It looks like you&apos;ve lost your internet connection. Don&apos;t
          worry — your recent data is cached locally.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
