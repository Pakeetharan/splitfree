"use client";

import { useMemo, useState } from "react";
import { Receipt, Search } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";
import { BalanceSummary } from "@/components/balances/balance-summary";
import type { PublicShareData } from "@/lib/services/share.service";
import type {
  ExpenseResponse,
  SettlementResponse,
  MemberResponse,
} from "@/types/api";

interface GroupData {
  name: string;
  description?: string;
  currency: string;
}

interface PublicDashboardProps {
  data: PublicShareData;
}

const EXPENSES_PER_PAGE = 20;

export function PublicDashboard({ data }: PublicDashboardProps) {
  const group = data.group as unknown as GroupData;
  const members = data.members as unknown as MemberResponse[];
  const expenses = data.expenses as unknown as ExpenseResponse[];
  const settlements = data.settlements as unknown as SettlementResponse[];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => e.description.toLowerCase().includes(q));
  }, [expenses, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE),
  );
  const pagedExpenses = filteredExpenses.slice(
    (page - 1) * EXPENSES_PER_PAGE,
    page * EXPENSES_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-primary bg-surface-elevated">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-accent">
                SplitFree — Shared View
              </div>
              <h1 className="mt-1 text-lg font-bold text-text-primary break-words sm:text-xl">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-sm text-text-muted break-words">
                  {group.description}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {group.currency}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-3 text-center sm:p-4">
            <p className="text-xl font-bold text-text-primary sm:text-2xl">
              {members.length}
            </p>
            <p className="text-xs text-text-muted">Members</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-3 text-center sm:p-4">
            <p className="text-xl font-bold text-text-primary sm:text-2xl">
              {expenses.length}
            </p>
            <p className="text-xs text-text-muted">Expenses</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-3 text-center sm:p-4">
            <p className="break-words text-base font-bold text-accent sm:text-lg">
              {formatAmount(totalExpenses, group.currency)}
            </p>
            <p className="text-xs text-text-muted">Total</p>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Members
          </h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m._id}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-sm text-text-secondary"
              >
                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white overflow-hidden">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold leading-none">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        {/* Balances */}
        {data.balances.length > 0 && (
          <BalanceSummary
            balances={data.balances}
            suggestions={data.suggestedSettlements}
            currency={group.currency}
          />
        )}

        {/* Expenses */}
        <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Expenses
            </h2>
            {expenses.length > 5 && (
              <div className="relative w-full sm:w-40">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search..."
                  aria-label="Search expenses"
                  className="w-full rounded-md border border-border-primary bg-surface-elevated py-1.5 pl-7 pr-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none sm:py-1 sm:text-xs"
                />
              </div>
            )}
          </div>

          {expenses.length === 0 ? (
            <div className="py-6 text-center">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-muted">
                No expenses yet
              </p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              No expenses match your search.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedExpenses.map((e) => (
                  <div
                    key={e._id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {e.description}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDate(e.date)} · Paid by{" "}
                        {memberMap[e.paidBy] ?? "Unknown"} ·{" "}
                        {e.splitAmong.length} people
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-text-primary">
                      {formatAmount(e.amount, group.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {filteredExpenses.length} expense
                    {filteredExpenses.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-md border border-border-primary px-2.5 py-1 text-xs font-medium text-text-secondary disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-text-muted">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-md border border-border-primary px-2.5 py-1 text-xs font-medium text-text-secondary disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Settlements
            </h2>
            <div className="space-y-2">
              {settlements.map((s) => (
                <div
                  key={s._id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2"
                >
                  <p className="min-w-0 flex-1 text-sm text-text-secondary">
                    <span className="font-medium">
                      {memberMap[s.payer] ?? "Unknown"}
                    </span>{" "}
                    paid{" "}
                    <span className="font-medium">
                      {memberMap[s.payee] ?? "Unknown"}
                    </span>
                  </p>
                  <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-positive">
                    {formatAmount(s.amount, group.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-muted">
          Read-only shared view · Expires{" "}
          {data.expiresAt ? formatDate(data.expiresAt) : "never"}
        </p>
      </main>
    </div>
  );
}
