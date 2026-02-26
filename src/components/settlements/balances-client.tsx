"use client";

import { useCallback, useEffect, useState } from "react";
import { BalanceChart } from "@/components/settlements/balance-chart";
import { SettleForm } from "@/components/settlements/settle-form";
import type {
  BalanceEntry,
  TransferSuggestion,
  MemberResponse,
} from "@/types/api";
import { formatAmount } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Handshake } from "lucide-react";

interface BalancesClientProps {
  groupId: string;
  currency: string;
  members: MemberResponse[];
  currentUserId: string;
  isOwner: boolean;
  initialBalances: BalanceEntry[];
  initialSuggestions: TransferSuggestion[];
}

export function BalancesClient({
  groupId,
  currency,
  members,
  currentUserId,
  isOwner,
  initialBalances,
  initialSuggestions,
}: BalancesClientProps) {
  const [balances, setBalances] = useState(initialBalances);
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  const currentUserMemberId = members.find(
    (m) => m.userId === currentUserId,
  )?._id;

  const refresh = useCallback(async () => {
    const [bRes, sRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/balances`),
      fetch(`/api/groups/${groupId}/suggested-settlements`),
    ]);
    if (bRes.ok) setBalances(await bRes.json());
    if (sRes.ok) setSuggestions(await sRes.json());
  }, [groupId]);

  useEffect(() => {
    setBalances(initialBalances);
    setSuggestions(initialSuggestions);
  }, [initialBalances, initialSuggestions]);

  const allSettled = balances.every((b) => b.netBalance === 0);

  return (
    <div className="space-y-6">
      {/* Balance chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Current Balances
        </h2>
        {allSettled ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Everyone is settled up!
            </p>
          </div>
        ) : (
          <BalanceChart balances={balances} currency={currency} />
        )}
      </div>

      {/* Suggested settlements */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Suggested Payments
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              {suggestions.length}
            </span>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {s.fromName}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {s.toName}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(s.amount, currency)}
                  </span>
                </div>
                {/* Only show Record Payment if owner, or if the current user is the payer */}
                {(isOwner || s.from === currentUserMemberId) && (
                  <SettleForm
                    groupId={groupId}
                    members={members}
                    currency={currency}
                    suggestion={s}
                    onSettled={refresh}
                    currentUserMemberId={currentUserMemberId}
                    isOwner={isOwner}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual record */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Handshake className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Record a manual settlement
          </p>
        </div>
        <SettleForm
          groupId={groupId}
          members={members}
          currency={currency}
          onSettled={refresh}
          currentUserMemberId={currentUserMemberId}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
