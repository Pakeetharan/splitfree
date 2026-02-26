"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { MemberResponse } from "@/types/api";

interface ExpenseFormProps {
  groupId: string;
  members: MemberResponse[];
  currency: string;
}

export function ExpenseForm({ groupId, members, currency }: ExpenseFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?._id ?? "");
  const [splitAmong, setSplitAmong] = useState<string[]>(
    members.map((m) => m._id),
  );
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create expense");
        return;
      }

      router.push(`/dashboard/groups/${groupId}/expenses`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Split among <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          {members.map((m) => (
            <label
              key={m._id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <input
                type="checkbox"
                checked={splitAmong.includes(m._id)}
                onChange={() => toggleMember(m._id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">
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
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            ≈ {currency}{" "}
            {(parseFloat(amountStr) / splitAmong.length).toFixed(2)} per person
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            !description.trim() ||
            !amountStr ||
            splitAmong.length === 0
          }
          className="flex-1"
        >
          {loading ? "Saving…" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
