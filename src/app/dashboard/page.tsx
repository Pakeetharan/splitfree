import Link from "next/link";
import { Plus } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getPageAuthUser } from "@/lib/auth";
import { listGroups } from "@/lib/services/group.service";
import { GroupCard } from "@/components/groups/group-card";
import { DashboardSummary } from "@/components/dashboard/summary-strip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { computeBalances } from "@/lib/engine/balance-calculator";

export const metadata = {
  title: `Dashboard — ${APP_NAME}`,
};

export default async function DashboardPage() {
  const user = await getPageAuthUser();
  const groups = await listGroups(user.id);

  // Compute per-group balances for the current user in parallel
  const balanceResults = await Promise.allSettled(
    groups.map(async (group) => {
      const groupId = group._id.toHexString();
      try {
        const balances = await computeBalances(user.id, groupId);
        // Find the member record linked to the current user
        const myBalance = balances.find((b) => {
          // We need to match by userId — but BalanceEntry only has memberId.
          // computeBalances returns all members; we'll match vs members list.
          return true; // placeholder — we'll refine below
        });
        return { groupId, balances };
      } catch {
        return { groupId, balances: [] };
      }
    }),
  );

  // Build a map of user's memberships to find their member IDs per group
  // We need the member service for this
  const { listMembers } = await import("@/lib/services/member.service");

  type BalanceInfo = {
    myBalance: number;
    totalOwed: number;
    totalLent: number;
  };

  const groupBalanceMap = new Map<string, BalanceInfo>();
  let crossGroupOwed = 0; // total you owe across all groups
  let crossGroupLent = 0; // total owed to you across all groups
  let primaryCurrency = "USD";

  for (const group of groups) {
    const groupId = group._id.toHexString();
    primaryCurrency = group.currency; // use last group's currency as reference
    try {
      const members = await listMembers(user.id, groupId);
      const myMember = members.find((m) => m.userId?.toHexString() === user.id);
      if (myMember) {
        const balances = await computeBalances(user.id, groupId);
        const myEntry = balances.find(
          (b) => b.memberId === myMember._id.toHexString(),
        );
        const myNet = myEntry?.netBalance ?? 0;
        groupBalanceMap.set(groupId, {
          myBalance: myNet,
          totalOwed: myNet < 0 ? Math.abs(myNet) : 0,
          totalLent: myNet > 0 ? myNet : 0,
        });
        if (myNet < 0) crossGroupOwed += Math.abs(myNet);
        if (myNet > 0) crossGroupLent += myNet;
      }
    } catch {
      // Skip groups where balance computation fails
    }
  }

  const netBalance = crossGroupLent - crossGroupOwed;

  // Determine quick action targets
  const recentGroupId =
    groups.length > 0 ? groups[0]._id.toHexString() : undefined;

  // Find group with most debt for "Settle Up" shortcut
  let settleGroupId: string | undefined;
  let maxDebt = 0;
  for (const [gid, info] of groupBalanceMap) {
    if (info.totalOwed > maxDebt) {
      maxDebt = info.totalOwed;
      settleGroupId = gid;
    }
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <>
      {/* Full-bleed summary strip */}
      <DashboardSummary
        totalOwed={crossGroupOwed}
        totalLent={crossGroupLent}
        netBalance={netBalance}
        currency={primaryCurrency}
        firstName={firstName}
      />

      {/* Main content */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick actions */}
        <QuickActions
          recentGroupId={recentGroupId}
          settleGroupId={settleGroupId}
        />

        {/* Groups section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Groups
              </h2>
              {groups.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {groups.length}
                </span>
              )}
            </div>
            <Link
              href="/dashboard/groups/new"
              className="hidden items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 sm:inline-flex dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="h-3.5 w-3.5" />
              New Group
            </Link>
          </div>

          {groups.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const gid = group._id.toHexString();
                const balInfo = groupBalanceMap.get(gid);
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
                      myBalance: balInfo?.myBalance,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty state */
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
        </section>
      </div>
    </>
  );
}
