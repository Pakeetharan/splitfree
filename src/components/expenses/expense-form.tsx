"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MemberResponse, ExpenseResponse, SplitType } from "@/types/api";

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

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "exact", label: "Exact" },
  { value: "percentage", label: "Percentage" },
  { value: "shares", label: "Shares" },
];

/** Even default values for a non-equal split, distributed like the server's floor+remainder discipline. */
function defaultSplitValues(
  type: SplitType,
  memberIds: string[],
  amountCents: number,
): Record<string, string> {
  const n = memberIds.length;
  if (n === 0) return {};

  if (type === "shares") {
    return Object.fromEntries(memberIds.map((id) => [id, "1"]));
  }

  if (type === "percentage") {
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    return Object.fromEntries(
      memberIds.map((id, i) => [id, String(i < remainder ? base + 1 : base)]),
    );
  }

  // exact — entered in currency units (dollars), even split of current amount
  const base = Math.floor(amountCents / n);
  const remainder = amountCents - base * n;
  return Object.fromEntries(
    memberIds.map((id, i) => [
      id,
      ((i < remainder ? base + 1 : base) / 100).toFixed(2),
    ]),
  );
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
  const [splitType, setSplitType] = useState<SplitType>(
    expense?.splitType ?? "equal",
  );
  const [splitValues, setSplitValues] = useState<Record<string, string>>(
    () => {
      if (expense?.splitValues && expense.splitType) {
        return Object.fromEntries(
          expense.splitValues.map((v) => [
            v.memberId,
            expense.splitType === "exact"
              ? (v.value / 100).toFixed(2)
              : String(v.value),
          ]),
        );
      }
      return {};
    },
  );
  const [category, setCategory] = useState(expense?.category ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [date, setDate] = useState(
    expense ? expense.date.split("T")[0] : today,
  );
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoading = (value: boolean) => {
    setLoadingState(value);
    onLoadingChange?.(value);
  };

  const amountCents = Math.round(parseFloat(amountStr || "0") * 100) || 0;

  const toggleMember = (memberId: string) => {
    setSplitAmong((prev) => {
      const next = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];
      if (splitType !== "equal") {
        setSplitValues(defaultSplitValues(splitType, next, amountCents));
      }
      return next;
    });
  };

  const changeSplitType = (type: SplitType) => {
    setSplitType(type);
    if (type !== "equal") {
      setSplitValues(defaultSplitValues(type, splitAmong, amountCents));
    }
  };

  const setSplitValue = (memberId: string, value: string) => {
    setSplitValues((prev) => ({ ...prev, [memberId]: value }));
  };

  // Validation for non-equal splits (client-side feedback only — the server
  // re-validates and computes the authoritative amounts).
  let splitTotal = 0;
  let splitValid = true;
  let splitTotalLabel = "";
  if (splitType === "exact") {
    splitTotal = splitAmong.reduce(
      (sum, id) => sum + (Math.round(parseFloat(splitValues[id] || "0") * 100) || 0),
      0,
    );
    splitValid = splitTotal === amountCents;
    splitTotalLabel = `${(splitTotal / 100).toFixed(2)} / ${(amountCents / 100).toFixed(2)}`;
  } else if (splitType === "percentage") {
    splitTotal = splitAmong.reduce(
      (sum, id) => sum + (parseFloat(splitValues[id] || "0") || 0),
      0,
    );
    splitValid = splitTotal === 100;
    splitTotalLabel = `${splitTotal}%`;
  } else if (splitType === "shares") {
    splitTotal = splitAmong.reduce(
      (sum, id) => sum + (parseInt(splitValues[id] || "0", 10) || 0),
      0,
    );
    splitValid = splitTotal > 0 && splitAmong.every((id) => (parseInt(splitValues[id] || "0", 10) || 0) >= 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountStr || !paidBy || splitAmong.length === 0)
      return;

    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (splitType !== "equal" && !splitValid) {
      setError("Split values must add up correctly before saving");
      return;
    }

    const splitValuesPayload =
      splitType === "equal"
        ? undefined
        : splitAmong.map((memberId) => ({
            memberId,
            value:
              splitType === "exact"
                ? Math.round(parseFloat(splitValues[memberId] || "0") * 100)
                : parseFloat(splitValues[memberId] || "0"),
          }));

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
            splitType,
            splitValues: splitValuesPayload,
            category: category || undefined,
            notes: notes.trim() || undefined,
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
            splitType,
            splitValues: splitValuesPayload,
            category: category || undefined,
            notes: notes.trim() || undefined,
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
      </div>

      {/* Split type */}
      {splitAmong.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Split type
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-border-primary p-1">
            {SPLIT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => changeSplitType(t.value)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  splitType === t.value
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {splitType === "equal" ? (
            amountStr && (
              <p className="mt-1.5 text-xs text-text-muted">
                ≈ {currency}{" "}
                {(parseFloat(amountStr) / splitAmong.length).toFixed(2)} per
                person
              </p>
            )
          ) : (
            <div className="mt-2 space-y-2 rounded-lg border border-border-primary p-3">
              {members
                .filter((m) => splitAmong.includes(m._id))
                .map((m) => (
                  <div key={m._id} className="flex items-center gap-3">
                    <span className="flex-1 truncate text-sm text-text-primary">
                      {m.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {splitType === "exact" && (
                        <span className="text-xs text-text-muted">
                          {currency}
                        </span>
                      )}
                      <input
                        type="number"
                        step={splitType === "shares" ? "1" : "0.01"}
                        min="0"
                        value={splitValues[m._id] ?? ""}
                        onChange={(e) => setSplitValue(m._id, e.target.value)}
                        className="w-20 rounded-md border border-border-primary bg-surface-elevated px-2 py-1 text-sm text-text-primary focus:border-blue-500 focus:outline-none"
                      />
                      {splitType === "percentage" && (
                        <span className="text-xs text-text-muted">%</span>
                      )}
                      {splitType === "shares" && (
                        <span className="text-xs text-text-muted">
                          share{splitValues[m._id] === "1" ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {splitType !== "shares" && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 pt-1 text-xs font-medium",
                    splitValid ? "text-positive" : "text-negative",
                  )}
                >
                  {splitValid ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  Total: {splitTotalLabel}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {/* Notes */}
      <Textarea
        label="Notes"
        placeholder="Add any details worth remembering (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={1000}
      />

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
            !description.trim() ||
            !amountStr ||
            splitAmong.length === 0 ||
            (splitType !== "equal" && !splitValid)
          }
          className="flex-1"
        >
          {isEditMode ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
