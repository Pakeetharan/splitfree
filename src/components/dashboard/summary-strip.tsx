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
    <div className="w-full border-b border-border-primary bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-4 text-sm font-medium text-text-muted">
          Welcome back,{" "}
          <span className="text-text-primary">{firstName}</span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* You owe */}
          <div className="flex items-center gap-4 rounded-xl border border-border-primary bg-surface-secondary p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <TrendingDown className="h-5 w-5 text-negative" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                You owe
              </p>
              <p className="mt-0.5 text-xl font-bold text-negative">
                {totalOwed > 0
                  ? formatAmount(totalOwed, currency)
                  : formatAmount(0, currency)}
              </p>
            </div>
          </div>

          {/* You're owed */}
          <div className="flex items-center gap-4 rounded-xl border border-border-primary bg-surface-secondary p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-5 w-5 text-positive" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                You&apos;re owed
              </p>
              <p className="mt-0.5 text-xl font-bold text-positive">
                {totalLent > 0
                  ? formatAmount(totalLent, currency)
                  : formatAmount(0, currency)}
              </p>
            </div>
          </div>

          {/* Net balance */}
          <div className="flex items-center gap-4 rounded-xl border border-border-primary bg-surface-secondary p-4">
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
                    ? "text-positive"
                    : netBalance < 0
                      ? "text-negative"
                      : "text-text-muted"
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Net balance
              </p>
              <p
                className={`mt-0.5 text-xl font-bold ${
                  netBalance > 0
                    ? "text-positive"
                    : netBalance < 0
                      ? "text-negative"
                      : "text-text-secondary"
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
