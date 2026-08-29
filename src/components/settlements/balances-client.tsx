"use client";

import { useCallback, useEffect, useState } from "react";
import { BalanceSummary } from "@/components/balances/balance-summary";
import { SettleForm } from "@/components/settlements/settle-form";
import type {
  BalanceEntry,
  TransferSuggestion,
  MemberResponse,
} from "@/types/api";
import { Handshake } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <BalanceSummary
        balances={balances}
        suggestions={suggestions}
        currency={currency}
        renderSuggestionAction={(s) =>
          // Only show Record Payment if owner, or if the current user is the payer
          (isOwner || s.from === currentUserMemberId) && (
            <SettleForm
              groupId={groupId}
              members={members}
              currency={currency}
              suggestion={s}
              onSettled={refresh}
              currentUserMemberId={currentUserMemberId}
              isOwner={isOwner}
            />
          )
        }
      />

      {/* Manual record */}
      <div className="flex items-center justify-between rounded-xl border border-border-primary bg-surface-elevated px-5 py-4">
        <div className="flex items-center gap-3">
          <Handshake className="h-5 w-5 text-text-muted" />
          <p className="text-sm text-text-secondary">
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
