// ─── App Constants ───────────────────────────────────────

export const APP_NAME = "SplitFree";
export const APP_DESCRIPTION =
  "Open-source expense splitting for friends, family, and groups";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Auth ────────────────────────────────────────────────
export const AUTH_COOKIE_NAME = "sb-auth-token";
export const AUTH_REDIRECT_PATH = "/dashboard";
export const LOGIN_PATH = "/login";

// ─── Public Paths (no auth required) ────────────────────
export const PUBLIC_PATHS = [
  "/",
  "/login",
  "/offline",
  "/api/auth/callback",
  "/api/share",
  "/api/health",
  "/share",
];

// ─── API ─────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SYNC_BATCH_SIZE = 50;
export const MAX_RETRY_COUNT = 5;

// ─── Currencies (common subset for MVP) ─────────────────
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
] as const;

// ─── Expense Categories ──────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "housing",
  "entertainment",
  "shopping",
  "utilities",
  "health",
  "travel",
  "education",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
