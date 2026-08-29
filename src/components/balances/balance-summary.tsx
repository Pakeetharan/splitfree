import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BalanceChart } from "@/components/settlements/balance-chart";
import { formatAmount } from "@/lib/utils";
import type { BalanceEntry, TransferSuggestion } from "@/types/api";
import type { ReactNode } from "react";

interface BalanceSummaryProps {
  balances: BalanceEntry[];
  suggestions: TransferSuggestion[];
  currency: string;
  /** Optional per-suggestion action area (e.g. a "Record Payment" button). */
  renderSuggestionAction?: (suggestion: TransferSuggestion) => ReactNode;
}

export function BalanceSummary({
  balances,
  suggestions,
  currency,
  renderSuggestionAction,
}: BalanceSummaryProps) {
  const allSettled = balances.every((b) => b.netBalance === 0);
  const groupTotal = balances.reduce((s, x) => s + x.totalSpent, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Balance chart */}
      <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Current Balances
        </h2>
        {allSettled ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="h-10 w-10 text-positive" />
            <p className="text-sm font-medium text-positive">
              Everyone is settled up!
            </p>
          </div>
        ) : (
          <BalanceChart balances={balances} currency={currency} />
        )}
      </div>

      {/* Total spent per person */}
      <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Total Spent
        </h2>
        <div className="space-y-3">
          {[...balances]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .map((b) => {
              const pct = Math.round((b.totalSpent / groupTotal) * 100);
              return (
                <div key={b.memberId} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-12 shrink-0 truncate text-xs font-medium text-text-secondary sm:w-24 sm:text-sm">
                    {b.name}
                  </div>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="min-w-12 shrink-0 whitespace-nowrap text-right text-xs font-semibold text-text-primary sm:min-w-24 sm:text-sm">
                    {formatAmount(b.totalSpent, currency)}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Suggested settlements */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Suggested Payments
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              {suggestions.length}
            </span>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="min-w-0 truncate font-medium text-text-primary">
                    {s.fromName}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
                  <span className="min-w-0 truncate font-medium text-text-primary">
                    {s.toName}
                  </span>
                  <span className="whitespace-nowrap font-semibold text-positive">
                    {formatAmount(s.amount, currency)}
                  </span>
                </div>
                {renderSuggestionAction?.(s)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
