import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { getExpense } from "@/lib/services/expense.service";
import { listMembers } from "@/lib/services/member.service";
import { serializeDoc, formatAmount, formatDate } from "@/lib/utils";
import type { ExpenseResponse, MemberResponse } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string; expenseId: string }>;
}

export default async function ExpenseDetailPage({ params }: PageProps) {
  const { id, expenseId } = await params;
  const user = await getPageAuthUser();

  let group;
  let expense: ExpenseResponse;
  let members: MemberResponse[];

  try {
    group = await getGroup(user.id, id);
    const [expenseDoc, memberDocs] = await Promise.all([
      getExpense(user.id, id, expenseId),
      listMembers(user.id, id),
    ]);
    expense = serializeDoc(expenseDoc);
    members = memberDocs.map(serializeDoc);
  } catch {
    notFound();
  }

  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  const splitMembers = expense.splitAmong.map((mid) => ({
    id: mid,
    name: memberMap[mid] ?? "Unknown",
  }));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/groups/${id}/expenses`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Expense Detail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group.name}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800/60 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{expense.description}</h2>
          {expense.category && (
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {expense.category}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatAmount(expense.amount, group.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Per Person</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ≈ {formatAmount(expense.splitAmount, group.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Paid By</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {memberMap[expense.paidBy] ?? "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Date</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(expense.date)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Split among ({splitMembers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {splitMembers.map((m) => (
              <span
                key={m.id}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
