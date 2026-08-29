"use client";

import { formatAmount } from "@/lib/utils";
import type { BalanceEntry } from "@/types/api";

interface BalanceChartProps {
  balances: BalanceEntry[];
  currency: string;
}

export function BalanceChart({ balances, currency }: BalanceChartProps) {
  const maxAbs = Math.max(...balances.map((b) => Math.abs(b.netBalance)), 1);

  return (
    <div className="space-y-3">
      {balances.map((b) => {
        const isPositive = b.netBalance >= 0;
        const pct = Math.round((Math.abs(b.netBalance) / maxAbs) * 100);

        return (
          <div key={b.memberId} className="flex items-center gap-3">
            <div className="w-16 shrink-0 truncate text-right text-sm font-medium text-text-secondary sm:w-24">
              {b.name}
            </div>

            <div className="flex flex-1 items-center gap-2">
              {/* negative side */}
              <div className="flex flex-1 justify-end">
                {!isPositive && (
                  <div
                    className="h-5 rounded-l-full bg-negative"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>

              {/* center line */}
              <div className="h-5 w-px bg-border-primary" />

              {/* positive side */}
              <div className="flex flex-1 justify-start">
                {isPositive && b.netBalance > 0 && (
                  <div
                    className="h-5 rounded-r-full bg-positive"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>

            <div
              className={`w-16 shrink-0 text-sm font-semibold sm:w-24 ${
                isPositive && b.netBalance > 0
                  ? "text-positive"
                  : b.netBalance < 0
                    ? "text-negative"
                    : "text-text-muted"
              }`}
            >
              {b.netBalance === 0
                ? "settled"
                : `${isPositive ? "+" : ""}${formatAmount(b.netBalance, currency)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
