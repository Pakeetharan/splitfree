import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount stored as integer cents to a display string.
 * e.g. 2550 → "$25.50"
 */
export function formatAmount(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert a decimal amount (e.g. 25.50) to integer cents (2550).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format a date string or Date to a human-readable format.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Recursively serialize a MongoDB document for JSON responses.
 * Converts ObjectId → string hex and Date → ISO string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDoc<T extends Record<string, any>>(doc: T): any {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === "object" && "toHexString" in value && typeof value.toHexString === "function") {
      result[key] = value.toHexString();
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        v && typeof v === "object" && "toHexString" in v ? v.toHexString() : v,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
