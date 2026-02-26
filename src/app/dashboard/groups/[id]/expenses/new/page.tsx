import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { listMembers } from "@/lib/services/member.service";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { serializeDoc } from "@/lib/utils";
import type { MemberResponse } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Add Expense" };

export default async function NewExpensePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getPageAuthUser();

  let group;
  let memberDocs;

  try {
    group = await getGroup(user.id, id);
    memberDocs = await listMembers(user.id, id);
  } catch {
    notFound();
  }

  const members: MemberResponse[] = memberDocs.map(serializeDoc);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/groups/${id}/expenses`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Add Expense</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group.name}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800/60">
        <ExpenseForm groupId={id} members={members} currency={group.currency} />
      </div>
    </div>
  );
}
