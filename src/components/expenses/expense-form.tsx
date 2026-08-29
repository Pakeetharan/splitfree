"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { MemberResponse, ExpenseResponse } from "@/types/api";

interface ExpenseFormProps {
  groupId: string;
  members: MemberResponse[];
  currency: string;
  /** When provided, the form operates in edit mode */
  expense?: ExpenseResponse;
  /** Called after a successful save in edit mode */
  onSaved?: () => void;
  /** Reports submit-in-flight state to the parent (e.g. to block dialog close) */
  onLoadingChange?: (loading: boolean) => void;
}

export function ExpenseForm({
  groupId,
  members,
  currency,
  expense,
  onSaved,
  onLoadingChange,
}: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const isEditMode = !!expense;

  const [description, setDescription] = useState(expense?.description ?? "");
  const [amountStr, setAmountStr] = useState(
    expense ? (expense.amount / 100).toFixed(2) : "",
  );
  const [paidBy, setPaidBy] = useState(
    expense?.paidBy ?? members[0]?._id ?? "",
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    expense?.splitAmong ?? members.map((m) => m._id),
  );
  const [category, setCategory] = useState(expense?.category ?? "");
  const [date, setDate] = useState(
    expense ? expense.date.split("T")[0] : today,
  );
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoading = (value: boolean) => {
    setLoadingState(value);
    onLoadingChange?.(value);
  };

  const toggleMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountStr || !paidBy || splitAmong.length === 0)
      return;

    const amountCents = Math.round(parseFloat(amountStr) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res: Response;

      if (isEditMode && expense) {
        // Edit mode — PATCH
        res = await fetch(`/api/groups/${groupId}/expenses/${expense._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            amount: amountCents,
            paidBy,
            splitAmong,
            category: category || undefined,
            date,
            _version: expense._version,
          }),
        });
      } else {
        // Create mode — POST
        res = await fetch(`/api/groups/${groupId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            amount: amountCents,
            paidBy,
            splitAmong,
            category: category || undefined,
            date,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        const message =
          data.error ?? `Failed to ${isEditMode ? "update" : "create"} expense`;
        setError(message);
        toast(message, "error");
        return;
      }

      toast(isEditMode ? "Expense updated" : "Expense added", "success");

      if (isEditMode && onSaved) {
        onSaved();
      } else {
        router.push(`/dashboard/groups/${groupId}/expenses`);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      toast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Description <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g. Dinner at restaurant"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Amount ({currency}) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          required
        />
      </div>

      {/* Paid By */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Paid by <span className="text-red-500">*</span>
        </label>
        <Select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
        >
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Split Among */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Split among <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2 rounded-lg border border-border-primary p-3">
          {members.map((m) => (
            <label
              key={m._id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <input
                type="checkbox"
                checked={splitAmong.includes(m._id)}
                onChange={() => toggleMember(m._id)}
                className="h-4 w-4 rounded border-border-primary accent-accent"
              />
              <span className="text-sm text-text-primary">
                {m.name}
              </span>
            </label>
          ))}
        </div>
        {splitAmong.length === 0 && (
          <p className="mt-1 text-xs text-red-500">
            Select at least one member
          </p>
        )}
        {amountStr && splitAmong.length > 0 && (
          <p className="mt-1.5 text-xs text-text-muted">
            ≈ {currency}{" "}
            {(parseFloat(amountStr) / splitAmong.length).toFixed(2)} per person
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Category
        </label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">No category</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="capitalize">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {/* Date */}
      <DatePicker label="Date" value={date} onChange={setDate} required />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEditMode && onSaved) {
              // In dialog mode, just close without saving
              onSaved();
            } else {
              router.back();
            }
          }}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={
            !description.trim() || !amountStr || splitAmong.length === 0
          }
          className="flex-1"
        >
          {isEditMode ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
