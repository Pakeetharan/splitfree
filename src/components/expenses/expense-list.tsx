"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { Button } from "@/components/ui/button";
import type { ExpenseResponse } from "@/types/api";

interface ExpenseListProps {
  groupId: string;
  currency: string;
  currentUserId: string;
  memberMap: Record<string, string>; // memberId -> name
  initialExpenses: ExpenseResponse[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

export function ExpenseList({
  groupId,
  currency,
  currentUserId,
  memberMap,
  initialExpenses,
  initialTotal,
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>(initialExpenses);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No expenses yet
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Add the first expense to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {expenses.map((exp) => (
              <ExpenseCard
                key={exp._id}
                expense={exp}
                currency={currency}
                paidByName={memberMap[exp.paidBy]}
                canDelete={exp.createdBy === currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-sm text-gray-500 dark:text-gray-400">
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
                <span className="min-w-12 text-center text-sm text-gray-600 dark:text-gray-400">
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
    </div>
  );
}
