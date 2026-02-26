"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MemberResponse, TransferSuggestion } from "@/types/api";

interface SettleFormProps {
  groupId: string;
  members: MemberResponse[];
  currency: string;
  suggestion?: TransferSuggestion | null;
  onSettled: () => void;
  currentUserMemberId?: string;
  isOwner?: boolean;
}

export function SettleForm({
  groupId,
  members,
  currency,
  suggestion,
  onSettled,
  currentUserMemberId,
  isOwner = true,
}: SettleFormProps) {
  const today = new Date().toISOString().split("T")[0];

  // Non-owners must always be the payer; default to suggestion or their own member record
  const defaultPayer =
    !isOwner && currentUserMemberId
      ? currentUserMemberId
      : (suggestion?.from ?? members[0]?._id ?? "");

  const [open, setOpen] = useState(false);
  const [payer, setPayer] = useState(defaultPayer);
  const [payee, setPayee] = useState(suggestion?.to ?? members[1]?._id ?? "");
  const [amountStr, setAmountStr] = useState(
    suggestion ? (suggestion.amount / 100).toFixed(2) : "",
  );
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (suggestion) {
      // Non-owners must remain as payer; if suggestion.from isn't them, only set payee + amount
      if (!isOwner && currentUserMemberId) {
        setPayer(currentUserMemberId);
        setPayee(suggestion.to);
      } else {
        setPayer(suggestion.from);
        setPayee(suggestion.to);
      }
      setAmountStr((suggestion.amount / 100).toFixed(2));
    } else if (!isOwner && currentUserMemberId) {
      setPayer(currentUserMemberId);
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amountStr) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer,
          payee,
          amount: amountCents,
          note: note.trim() || undefined,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to record settlement");
        return;
      }

      setOpen(false);
      onSettled();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={suggestion ? "outline" : "default"}
        size="sm"
      >
        {suggestion ? "Record Payment" : "Record Settlement"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Settlement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                From (Payer) <span className="text-red-500">*</span>
              </label>
              {isOwner ? (
                <Select
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {members.find((m) => m._id === currentUserMemberId)?.name ??
                    "You"}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                To (Payee) <span className="text-red-500">*</span>
              </label>
              <Select
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>

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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Note <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Cash payment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DatePicker label="Date" value={date} onChange={setDate} required />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !amountStr}>
                {loading ? "Saving…" : "Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
