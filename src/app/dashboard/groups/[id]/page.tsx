import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  UtensilsCrossed,
  Car,
  Home,
  Tv,
  ShoppingCart,
  Zap,
  Heart,
  Plane,
  BookOpen,
  Package,
  ArrowRight,
  Receipt,
  Plus,
} from "lucide-react";
import { GroupPageShell } from "@/components/groups/group-page-shell";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { listMembers } from "@/lib/services/member.service";
import { getExpensesCollection } from "@/lib/mongodb/collections";
import { computeBalances } from "@/lib/engine/balance-calculator";
import { computeOptimalSettlements } from "@/lib/engine/settlement-optimizer";
import { formatAmount, formatDate } from "@/lib/utils";
import { ObjectId } from "mongodb";

function getCategoryIcon(category: string | null) {
  switch (category) {
    case "food":
      return <UtensilsCrossed className="h-4 w-4" />;
    case "transport":
      return <Car className="h-4 w-4" />;
    case "housing":
      return <Home className="h-4 w-4" />;
    case "entertainment":
      return <Tv className="h-4 w-4" />;
    case "shopping":
      return <ShoppingCart className="h-4 w-4" />;
    case "utilities":
      return <Zap className="h-4 w-4" />;
    case "health":
      return <Heart className="h-4 w-4" />;
    case "travel":
      return <Plane className="h-4 w-4" />;
    case "education":
      return <BookOpen className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const user = await getPageAuthUser();
    const group = await getGroup(user.id, id);
    return { title: group.name };
  } catch {
    return { title: "Group" };
  }
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params;

  let group;
  let user: Awaited<ReturnType<typeof getPageAuthUser>>;
  try {
    user = await getPageAuthUser();
    group = await getGroup(user.id, id);
  } catch {
    notFound();
  }

  const groupId = group._id.toHexString();
  const groupOid = new ObjectId(id);

  // Fetch all overview data in parallel
  const expensesCol = await getExpensesCollection();
  const [
    memberDocs,
    balances,
    recentExpenses,
    totalExpenseCount,
    totalAmountResult,
  ] = await Promise.all([
    listMembers(user.id, id),
    computeBalances(user.id, id),
    expensesCol
      .find({ groupId: groupOid, deletedAt: null })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .toArray(),
    expensesCol.countDocuments({ groupId: groupOid, deletedAt: null }),
    expensesCol
      .aggregate<{
        total: number;
      }>([
        { $match: { groupId: groupOid, deletedAt: null } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);

  const totalSpent = totalAmountResult[0]?.total ?? 0;
  const memberCount = memberDocs.length;

  // Member name map keyed by hex string — uses listMembers enriched names (user profile join)
  // computeBalances() reads raw DB docs where linked users have name="" so we patch here.
  const memberNameMap = new Map(
    memberDocs.map((m) => [m._id.toHexString(), m.name?.trim() || "Member"]),
  );

  // Enrich balance entries with correct names from the enriched member list
  const enrichedBalances = balances.map((b) => ({
    ...b,
    name: memberNameMap.get(b.memberId) ?? b.name,
  }));

  // Current user's member record id
  const currentMember = memberDocs.find(
    (m) => m.userId?.toHexString() === user.id,
  );
  const myMemberId = currentMember?._id?.toHexString() ?? "";
  const myBalance = enrichedBalances.find((b) => b.memberId === myMemberId);
  const myNet = myBalance?.netBalance ?? 0;

  // Suggested settlements (using enriched names so payee/payer labels are correct)
  const suggestedSettlements = computeOptimalSettlements(enrichedBalances);
  const myPayments = suggestedSettlements.filter((s) => s.from === myMemberId);

  // Sort balances: debtors first (most negative), then creditors
  const sortedBalances = [...enrichedBalances].sort(
    (a, b) => a.netBalance - b.netBalance,
  );

  return (
    <GroupPageShell
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      currencyCode={group.currency}
    >
      {/* ── Your Balance ─────────────────────────────────── */}
      <div>
        <div
          className={`rounded-xl border p-5 ${
            myNet > 0
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : myNet < 0
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  myNet > 0
                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                    : myNet < 0
                      ? "bg-red-100 dark:bg-red-900/50"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {myNet > 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : myNet < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Your balance
                </p>
                <p
                  className={`mt-0.5 text-2xl font-bold ${
                    myNet > 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : myNet < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {myNet === 0
                    ? "All settled up!"
                    : (myNet > 0 ? "+" : "−") +
                      " " +
                      formatAmount(Math.abs(myNet), group.currency)}
                </p>
              </div>
            </div>
            {myNet < 0 && (
              <Link
                href={`/dashboard/groups/${groupId}/settlements`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Settle Up
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Total Spent
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 sm:text-xl dark:text-gray-100">
            {formatAmount(totalSpent, group.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Expenses
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 sm:text-xl dark:text-gray-100">
            {totalExpenseCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Members
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 sm:text-xl dark:text-gray-100">
            {memberCount}
          </p>
        </div>
      </div>

      {/* ── 2-column desktop layout ──────────────────────── */}
      <div className="mt-8 gap-8 space-y-8 lg:grid lg:grid-cols-3 lg:space-y-0">
        {/* Main column — Recent Expenses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payments you need to make */}
          {myPayments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Payments you need to make
              </h2>
              <div className="space-y-2">
                {myPayments.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                      <ArrowRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        Pay{" "}
                        <span className="font-semibold text-orange-700 dark:text-orange-400">
                          {s.toName}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="whitespace-nowrap font-semibold text-orange-700 dark:text-orange-400">
                        {formatAmount(s.amount, group.currency)}
                      </p>
                      <Link
                        href={`/dashboard/groups/${groupId}/settlements`}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                      >
                        Record
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Recent expenses
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/groups/${groupId}/expenses/new`}
                  className="hidden items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 sm:inline-flex dark:text-blue-400"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Link>
                <Link
                  href={`/dashboard/groups/${groupId}/expenses`}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  View all →
                </Link>
              </div>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center dark:border-gray-700">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No expenses yet
                </p>
                <Link
                  href={`/dashboard/groups/${groupId}/expenses/new`}
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Add Expense
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {recentExpenses.map((expense) => {
                  const payerName =
                    memberNameMap.get(expense.paidBy.toHexString()) ??
                    "Unknown";
                  return (
                    <div
                      key={expense._id.toHexString()}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Paid by {payerName} · {formatDate(expense.date)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {formatAmount(expense.amount, group.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side column — Balances */}
        <div className="space-y-6 lg:col-span-1">
          {/* Group Balances */}
          {sortedBalances.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Balances
                </h2>
                <Link
                  href={`/dashboard/groups/${groupId}/balances`}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Details →
                </Link>
              </div>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {sortedBalances.map((b) => {
                  const isMe = b.memberId === myMemberId;
                  return (
                    <div
                      key={b.memberId}
                      className="flex items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {(b.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="min-w-0 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                          {b.name || "Member"}
                          {isMe && (
                            <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                              you
                            </span>
                          )}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap text-sm font-semibold ${
                          b.netBalance > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : b.netBalance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {b.netBalance === 0
                          ? "Settled"
                          : (b.netBalance > 0 ? "+" : "−") +
                            " " +
                            formatAmount(
                              Math.abs(b.netBalance),
                              group.currency,
                            )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settlements CTA */}
          <Link
            href={`/dashboard/groups/${groupId}/settlements`}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200  bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View settlements →
          </Link>
        </div>
      </div>
    </GroupPageShell>
  );
}
