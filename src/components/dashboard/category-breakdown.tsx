import { formatAmount } from "@/lib/utils";

export interface CategoryTotal {
  category: string;
  total: number;
}

interface CategoryBreakdownProps {
  categories: CategoryTotal[];
  currency: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  transport: "Transport",
  housing: "Housing",
  entertainment: "Entertainment",
  shopping: "Shopping",
  utilities: "Utilities",
  health: "Health",
  travel: "Travel",
  education: "Education",
  other: "Other",
};

export function CategoryBreakdown({
  categories,
  currency,
}: CategoryBreakdownProps) {
  if (categories.length === 0) return null;

  const max = Math.max(...categories.map((c) => c.total), 1);

  return (
    <div className="space-y-2.5">
      {categories.map((c) => {
        const pct = Math.round((c.total / max) * 100);
        return (
          <div key={c.category} className="flex items-center gap-3">
            <div className="w-20 shrink-0 truncate text-xs font-medium text-text-secondary sm:w-24">
              {CATEGORY_LABELS[c.category] ?? c.category}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-xs font-semibold text-text-primary sm:w-20">
              {formatAmount(c.total, currency)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
