import { formatAmount } from "@/lib/utils";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";

interface DashboardSummaryProps {
  totalOwed: number; // cents — you owe others (positive = you owe)
  totalLent: number; // cents — others owe you
  netBalance: number; // cents — net (positive = you're owed)
  currency: string;
  firstName: string;
}

export function DashboardSummary({
  totalOwed,
  totalLent,
  netBalance,
  currency,
  firstName,
}: DashboardSummaryProps) {
  return (
    <div className="w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Welcome back,{" "}
          <span className="text-gray-900 dark:text-gray-100">{firstName}</span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* You owe */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                You owe
              </p>
              <p className="mt-0.5 text-xl font-bold text-red-600 dark:text-red-400">
                {totalOwed > 0
                  ? formatAmount(totalOwed, currency)
                  : formatAmount(0, currency)}
              </p>
            </div>
          </div>

          {/* You're owed */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                You&apos;re owed
              </p>
              <p className="mt-0.5 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalLent > 0
                  ? formatAmount(totalLent, currency)
                  : formatAmount(0, currency)}
              </p>
            </div>
          </div>

          {/* Net balance */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                netBalance > 0
                  ? "bg-emerald-100 dark:bg-emerald-900/40"
                  : netBalance < 0
                    ? "bg-red-100 dark:bg-red-900/40"
                    : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Scale
                className={`h-5 w-5 ${
                  netBalance > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : netBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Net balance
              </p>
              <p
                className={`mt-0.5 text-xl font-bold ${
                  netBalance > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : netBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {netBalance === 0
                  ? "All settled!"
                  : (netBalance > 0 ? "+" : "−") +
                    " " +
                    formatAmount(Math.abs(netBalance), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
