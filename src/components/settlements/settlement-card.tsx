"use client";

import { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/utils";
import type { SettlementResponse } from "@/types/api";

interface SettlementCardProps {
  settlement: SettlementResponse;
  currency: string;
  memberMap: Record<string, string>;
  canDelete?: boolean;
  onDelete?: (settlementId: string) => void;
}

export function SettlementCard({
  settlement,
  currency,
  memberMap,
  canDelete,
  onDelete,
}: SettlementCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    if (!confirm("Delete this settlement?")) return;
    setDeleting(true);
    try {
      await onDelete(settlement._id);
    } finally {
      setDeleting(false);
    }
  };

  const payerName =
    memberMap[settlement.payer] ?? settlement.payerName ?? "Unknown";
  const payeeName =
    memberMap[settlement.payee] ?? settlement.payeeName ?? "Unknown";

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          <span>{payerName}</span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span>{payeeName}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(settlement.date)}</span>
          {settlement.note && (
            <span className="truncate">{settlement.note}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatAmount(settlement.amount, currency)}
        </span>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            aria-label="Delete settlement"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
