"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { MemberResponse } from "@/types/api";
import type { ExpenseSortOrder } from "@/lib/services/expense.service";

export interface ExpenseFilterState {
  search: string;
  category: string;
  memberId: string;
  sort: ExpenseSortOrder;
}

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilterState = {
  search: "",
  category: "",
  memberId: "",
  sort: "date_desc",
};

interface ExpenseFiltersProps {
  members: MemberResponse[];
  value: ExpenseFilterState;
  onChange: (value: ExpenseFilterState) => void;
}

const SORT_OPTIONS: { value: ExpenseSortOrder; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
];

export function ExpenseFilters({
  members,
  value,
  onChange,
}: ExpenseFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(value.search);

  useEffect(() => {
    setSearchDraft(value.search);
  }, [value.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== value.search) {
        onChange({ ...value, search: searchDraft });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-primary bg-surface-elevated p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Search expenses..."
          className="pl-9"
          aria-label="Search expenses"
        />
      </div>

      <Select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
        aria-label="Filter by category"
        className="sm:w-40"
      >
        <option value="">All categories</option>
        {EXPENSE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat} className="capitalize">
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </Select>

      <Select
        value={value.memberId}
        onChange={(e) => onChange({ ...value, memberId: e.target.value })}
        aria-label="Filter by member"
        className="sm:w-40"
      >
        <option value="">All members</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </Select>

      <Select
        value={value.sort}
        onChange={(e) =>
          onChange({ ...value, sort: e.target.value as ExpenseSortOrder })
        }
        aria-label="Sort expenses"
        className="sm:w-44"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function hasActiveExpenseFilters(filters: ExpenseFilterState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.category !== "" ||
    filters.memberId !== ""
  );
}
