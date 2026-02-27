"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatAmount, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { ExpenseResponse } from "@/types/api";

interface ExpenseCardProps {
  expense: ExpenseResponse;
  currency: string;
  paidByName?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (expense: ExpenseResponse) => void;
  onDelete?: (expenseId: string) => void;
}

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  transport: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  housing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  entertainment:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  shopping:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  utilities: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  health:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  travel: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  education:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export function ExpenseCard({
  expense,
  currency,
  paidByName,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(expense._id);
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const catColor =
    expense.category && categoryColors[expense.category]
      ? categoryColors[expense.category]
      : categoryColors.other;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {expense.description}
          </span>
          {expense.category && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${catColor}`}
            >
              {expense.category}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(expense.date)}</span>
          {paidByName && <span>Paid by {paidByName}</span>}
          <span>
            {expense.splitAmong.length} member
            {expense.splitAmong.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatAmount(expense.amount, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatAmount(expense.splitAmount, currency)}/person
          </p>
        </div>

        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(expense)}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Edit expense"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleting}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                aria-label="Delete expense"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Expense"
        description={`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
