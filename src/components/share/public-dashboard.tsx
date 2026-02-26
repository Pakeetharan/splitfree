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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                SplitFree — Shared View
              </div>
              <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {members.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {expenses.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatAmount(totalExpenses, group.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/60">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Members
          </h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m._id}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/60">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Recent Expenses
          </h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses yet.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {e.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(e.date)} · Paid by{" "}
                      {memberMap[e.paidBy] ?? "Unknown"} · {e.splitAmong.length}{" "}
                      people
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatAmount(e.amount, group.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/60">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Settlements
            </h2>
            <div className="space-y-2">
              {settlements.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">
                      {memberMap[s.payer] ?? "Unknown"}
                    </span>{" "}
                    paid{" "}
                    <span className="font-medium">
                      {memberMap[s.payee] ?? "Unknown"}
                    </span>
                  </p>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatAmount(s.amount, group.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Read-only shared view · Expires{" "}
          {data.expiresAt ? formatDate(data.expiresAt) : "never"}
        </p>
      </main>
    </div>
  );
}
