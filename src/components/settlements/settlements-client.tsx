"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { SettlementCard } from "@/components/settlements/settlement-card";
import { SettleForm } from "@/components/settlements/settle-form";
import type { SettlementResponse, MemberResponse } from "@/types/api";

interface SettlementsClientProps {
  groupId: string;
  currency: string;
  currentUserId: string;
  isOwner: boolean;
  memberMap: Record<string, string>;
  members: MemberResponse[];
  initialSettlements: SettlementResponse[];
}

export function SettlementsClient({
  groupId,
  currency,
  currentUserId,
  isOwner,
  memberMap,
  members,
  initialSettlements,
}: SettlementsClientProps) {
  const [settlements, setSettlements] = useState(initialSettlements);

  const currentUserMemberId = members.find(
    (m) => m.userId === currentUserId,
  )?._id;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/settlements`);
    if (res.ok) setSettlements(await res.json());
  }, [groupId]);

  useEffect(() => {
    setSettlements(initialSettlements);
  }, [initialSettlements]);

  const handleDelete = async (settlementId: string) => {
    const res = await fetch(
      `/api/groups/${groupId}/settlements/${settlementId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSettlements((prev) => prev.filter((s) => s._id !== settlementId));
    }
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {settlements.length} settlement{settlements.length !== 1 ? "s" : ""}
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

      {/* Settlement list */}
      {settlements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No settlements recorded yet
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Check{" "}
            <Link
              href={`/dashboard/groups/${groupId}/balances`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Balances
            </Link>{" "}
            for suggested payments.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {settlements.map((s) => (
            <SettlementCard
              key={s._id}
              settlement={s}
              currency={currency}
              memberMap={memberMap}
              canDelete={s.createdBy === currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
