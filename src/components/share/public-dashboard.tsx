import { Receipt } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";
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

export function PublicDashboard({ data }: PublicDashboardProps) {
  const group = data.group as unknown as GroupData;
  const members = data.members as unknown as MemberResponse[];
  const expenses = data.expenses as unknown as ExpenseResponse[];
  const settlements = data.settlements as unknown as SettlementResponse[];

  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-primary bg-surface-elevated">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-accent">
                SplitFree — Shared View
              </div>
              <h1 className="mt-1 text-xl font-bold text-text-primary">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-sm text-text-muted">
                  {group.description}
                </p>
              )}
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {group.currency}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {members.length}
            </p>
            <p className="text-xs text-text-muted">Members</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {expenses.length}
            </p>
            <p className="text-xs text-text-muted">Expenses</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-elevated p-4 text-center">
            <p className="text-lg font-bold text-accent">
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

        {/* Expenses */}
        <div className="rounded-xl border border-border-primary bg-surface-elevated p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Recent Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="py-6 text-center">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-muted">
                No expenses yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {e.description}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(e.date)} · Paid by{" "}
                      {memberMap[e.paidBy] ?? "Unknown"} · {e.splitAmong.length}{" "}
                      people
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatAmount(e.amount, group.currency)}
                  </span>
                </div>
              ))}
            </div>
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
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                >
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium">
                      {memberMap[s.payer] ?? "Unknown"}
                    </span>{" "}
                    paid{" "}
                    <span className="font-medium">
                      {memberMap[s.payee] ?? "Unknown"}
                    </span>
                  </p>
                  <span className="text-sm font-semibold text-positive">
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
