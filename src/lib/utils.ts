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
 * Format a date as a short relative time string, e.g. "2 days ago", "just now".
 */
export function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? "s" : ""} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof value.toHexString === "function") {
    return value.toHexString();
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") return serializeDoc(value);
  return value;
}

/**
 * Recursively serialize a MongoDB document (including nested objects/arrays)
 * for JSON responses. Converts ObjectId → string hex and Date → ISO string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDoc<T extends Record<string, any>>(doc: T): any {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    result[key] = serializeValue(value);
  }
  return result;
}
