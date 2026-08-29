import Link from "next/link";
import { Plus } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getPageAuthUser } from "@/lib/auth";
import { listGroups } from "@/lib/services/group.service";
import { listMembers } from "@/lib/services/member.service";
import { GroupsGrid } from "@/components/groups/groups-grid";
import { computeBalances } from "@/lib/engine/balance-calculator";
import { getExpensesCollection } from "@/lib/mongodb/collections";

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

  // Last activity per group
  const lastActivityMap = new Map<string, string>();
  if (groups.length > 0) {
    const expensesCol = await getExpensesCollection();
    const lastActivityResult = await expensesCol
      .aggregate<{ _id: import("mongodb").ObjectId; lastDate: Date }>([
        {
          $match: {
            groupId: { $in: groups.map((g) => g._id) },
            deletedAt: null,
          },
        },
        { $group: { _id: "$groupId", lastDate: { $max: "$createdAt" } } },
      ])
      .toArray();
    for (const row of lastActivityResult) {
      lastActivityMap.set(row._id.toHexString(), row.lastDate.toISOString());
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Groups
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/groups/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          New Group
        </Link>
      </div>

      {/* Group grid */}
      {groups.length > 0 ? (
        <GroupsGrid
          groups={groups.map((group) => {
            const gid = group._id.toHexString();
            return {
              _id: gid,
              name: group.name,
              description: group.description,
              currency: group.currency,
              memberCount: group.memberCount,
              createdAt: group.createdAt.toISOString(),
              myBalance: groupBalanceMap.get(gid),
              lastActivityAt: lastActivityMap.get(gid) ?? null,
            };
          })}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-primary px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Plus className="h-7 w-7 text-accent" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No groups yet</h2>
          <p className="mt-1 text-sm text-text-muted">
            Create your first group to start splitting expenses.
          </p>
          <Link
            href="/dashboard/groups/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
        </div>
      )}
    </div>
  );
}
