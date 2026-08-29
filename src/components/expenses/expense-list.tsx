"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { EditExpenseDialog } from "@/components/expenses/edit-expense-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ExpenseResponse, MemberResponse } from "@/types/api";

interface ExpenseListProps {
  groupId: string;
  currency: string;
  currentUserId: string;
  isOwner: boolean;
  members: MemberResponse[];
  memberMap: Record<string, string>; // memberId -> name
  initialExpenses: ExpenseResponse[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

export function ExpenseList({
  groupId,
  currency,
  currentUserId,
  isOwner,
  members,
  memberMap,
  initialExpenses,
  initialTotal,
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>(initialExpenses);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(
    null,
  );
  const { toast } = useToast();

  const loadPage = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/groups/${groupId}/expenses?page=${p}&limit=${PAGE_SIZE}`,
        );
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.data);
          setTotal(data.total);
          setPage(p);
        }
      } finally {
        setLoading(false);
      }
    },
    [groupId],
  );

  useEffect(() => {
    setExpenses(initialExpenses);
    setTotal(initialTotal);
    setPage(1);
  }, [initialExpenses, initialTotal]);

  const handleDelete = async (expenseId: string) => {
    const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      setTotal((prev) => prev - 1);
      toast("Expense deleted", "success");
    } else {
      toast("Failed to delete expense", "error");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-primary px-6 py-12 text-center">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-muted">
            No expenses yet
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Add the first expense to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {expenses.map((exp) => {
              const canModify = exp.createdBy === currentUserId || isOwner;
              return (
                <ExpenseCard
                  key={exp._id}
                  expense={exp}
                  currency={currency}
                  paidByName={memberMap[exp.paidBy]}
                  canEdit={canModify}
                  canDelete={canModify}
                  onEdit={setEditingExpense}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-border-primary bg-surface-elevated px-4 py-3">
              <span className="text-sm text-text-muted">
                {total} expense{total !== 1 ? "s" : ""} total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => loadPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="min-w-12 text-center text-sm text-text-secondary">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit expense dialog */}
      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          groupId={groupId}
          expense={editingExpense}
          members={members}
          currency={currency}
          onSaved={() => {
            setEditingExpense(null);
            loadPage(page);
          }}
        />
      )}
    </div>
  );
}
