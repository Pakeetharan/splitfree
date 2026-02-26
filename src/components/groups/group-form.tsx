"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface GroupFormProps {
  defaultValues?: {
    name?: string;
    description?: string;
    currency?: string;
  };
  onSubmit: (data: {
    name: string;
    description: string;
    currency: string;
  }) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const currencyOptions = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.symbol} ${c.name} (${c.code})`,
}));

export function GroupForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Create Group",
}: GroupFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "USD");
  const [errors, setErrors] = useState<{ name?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    const trimmed = name.trim();

    if (!trimmed) {
      next.name = "Group name is required";
    } else if (trimmed.length > 100) {
      next.name = "Group name must be 100 characters or fewer";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      currency,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="name"
        label="Group Name"
        placeholder="e.g. Weekend Trip"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={isLoading}
        maxLength={100}
      />

      <div className="w-full">
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="What is this group for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className={cn(
            "flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
          )}
        />
      </div>

      <Select
        id="currency"
        label="Currency"
        options={currencyOptions}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        disabled={isLoading}
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving…" : submitLabel}
        </Button>
        <Link href="/dashboard">
          <Button type="button" variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
