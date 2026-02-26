import Link from "next/link";
import { Plus } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getPageAuthUser } from "@/lib/auth";
import { listGroups } from "@/lib/services/group.service";
import { listMembers } from "@/lib/services/member.service";
import { GroupCard } from "@/components/groups/group-card";
import { computeBalances } from "@/lib/engine/balance-calculator";

export const metadata = {
  title: `Groups — ${APP_NAME}`,
};

export default async function GroupsPage() {
  const user = await getPageAuthUser();
  const groups = await listGroups(user.id);

  // Compute per-group balance for the current user
  const groupBalanceMap = new Map<string, number>();

  for (const group of groups) {
    const groupId = group._id.toHexString();
    try {
      const members = await listMembers(user.id, groupId);
      const myMember = members.find((m) => m.userId?.toHexString() === user.id);
      if (myMember) {
        const balances = await computeBalances(user.id, groupId);
        const myEntry = balances.find(
          (b) => b.memberId === myMember._id.toHexString(),
        );
        groupBalanceMap.set(groupId, myEntry?.netBalance ?? 0);
      }
    } catch {
      // skip
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Groups
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/groups/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          New Group
        </Link>
      </div>

      {/* Group grid */}
      {groups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const gid = group._id.toHexString();
            return (
              <GroupCard
                key={gid}
                group={{
                  _id: gid,
                  name: group.name,
                  description: group.description,
                  currency: group.currency,
                  memberCount: group.memberCount,
                  createdAt: group.createdAt.toISOString(),
                  myBalance: groupBalanceMap.get(gid),
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Plus className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No groups yet</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first group to start splitting expenses.
          </p>
          <Link
            href="/dashboard/groups/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
        </div>
      )}
    </div>
  );
}
