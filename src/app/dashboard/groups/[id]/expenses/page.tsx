import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { listExpenses } from "@/lib/services/expense.service";
import { listMembers } from "@/lib/services/member.service";
import { GroupPageShell } from "@/components/groups/group-page-shell";
import { ExpenseList } from "@/components/expenses/expense-list";
import { serializeDoc, formatAmount } from "@/lib/utils";
import type { ExpenseResponse, MemberResponse } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const user = await getPageAuthUser();
    const group = await getGroup(user.id, id);
    return { title: `Expenses — ${group.name}` };
  } catch {
    return { title: "Expenses" };
  }
}

export default async function ExpensesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getPageAuthUser();

  let group;
  let expenseResult;
  let memberDocs;

  try {
    group = await getGroup(user.id, id);
    [expenseResult, memberDocs] = await Promise.all([
      listExpenses(user.id, id, { page: 1, limit: 20 }),
      listMembers(user.id, id),
    ]);
  } catch {
    notFound();
  }

  const groupId = group._id.toHexString();
  const expenses: ExpenseResponse[] = expenseResult.expenses.map(serializeDoc);
  const members: MemberResponse[] = memberDocs.map(serializeDoc);
  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  const totalSpend = expenseResult.expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  return (
    <GroupPageShell
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      currencyCode={group.currency}
    >
      {/* Stats + Add CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {expenseResult.total > 0 ? (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {expenseResult.total} expense
                {expenseResult.total !== 1 ? "s" : ""} total
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(totalSpend, group.currency)}
              </p>
            </div>
          </div>
        ) : (
          <div />
        )}

        <Link
          href={`/dashboard/groups/${id}/expenses/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Link>
      </div>

      {/* Expense list */}
      <div className="mt-6">
        <ExpenseList
          groupId={id}
          currency={group.currency}
          currentUserId={user.id}
          memberMap={memberMap}
          initialExpenses={expenses}
          initialTotal={expenseResult.total}
        />
      </div>
    </GroupPageShell>
  );
}
