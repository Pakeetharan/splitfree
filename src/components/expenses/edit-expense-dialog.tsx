"use client";

import { Dialog } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { ExpenseResponse, MemberResponse } from "@/types/api";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  expense: ExpenseResponse;
  members: MemberResponse[];
  currency: string;
  onSaved: () => void;
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  groupId,
  expense,
  members,
  currency,
  onSaved,
}: EditExpenseDialogProps) {
  const handleSaved = () => {
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Expense">
      <ExpenseForm
        groupId={groupId}
        members={members}
        currency={currency}
        expense={expense}
        onSaved={handleSaved}
      />
    </Dialog>
  );
}
