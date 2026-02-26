import Link from "next/link";
import { Receipt, Users, ArrowLeftRight } from "lucide-react";

interface QuickActionsProps {
  /** Group ID with highest debt — for "Settle Up" shortcut */
  settleGroupId?: string;
  /** Most recent group ID — for "Add Expense" shortcut */
  recentGroupId?: string;
}

export function QuickActions({
  settleGroupId,
  recentGroupId,
}: QuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {recentGroupId ? (
        <Link
          href={`/dashboard/groups/${recentGroupId}/expenses/new`}
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/50 dark:group-hover:bg-blue-900">
            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Add Expense
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Record a new expense
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Receipt className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
              Add Expense
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Create a group first
            </p>
          </div>
        </div>
      )}

      <Link
        href="/dashboard/groups/new"
        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/50 dark:group-hover:bg-emerald-900">
          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            New Group
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Start splitting expenses
          </p>
        </div>
      </Link>

      {settleGroupId ? (
        <Link
          href={`/dashboard/groups/${settleGroupId}/settlements`}
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-purple-300 hover:bg-purple-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 transition-colors group-hover:bg-purple-200 dark:bg-purple-900/50 dark:group-hover:bg-purple-900">
            <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Settle Up
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clear outstanding balances
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <ArrowLeftRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
              Settle Up
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No balances to settle
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
