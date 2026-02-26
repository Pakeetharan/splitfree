// ─── Auth Types ──────────────────────────────────────────
export interface AuthUser {
  id: string; // MongoDB _id as string
  supabaseId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// ─── API Response Types ──────────────────────────────────
export interface ApiError {
  error: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Group API ───────────────────────────────────────────
export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
}

export interface GroupResponse {
  _id: string;
  name: string;
  description: string | null;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  memberCount?: number;
  expenseCount?: number;
  totalExpenses?: number;
}

// ─── Member API ──────────────────────────────────────────
export interface AddMemberRequest {
  name: string;
  email?: string;
}

export interface UpdateMemberRequest {
  name?: string;
  email?: string;
}

export interface MemberResponse {
  _id: string;
  groupId: string;
  userId: string | null;
  name: string;
  email: string | null;
  avatarUrl?: string | null;
  role: string;
  isVirtual: boolean;
  createdAt: string;
  updatedAt: string;
  _version: number;
}

// ─── Expense API ─────────────────────────────────────────
export interface CreateExpenseRequest {
  description: string;
  amount: number; // in cents
  paidBy: string; // member _id
  splitAmong: string[]; // member _id[]
  category?: string;
  date: string; // ISO 8601
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  paidBy?: string;
  splitAmong?: string[];
  category?: string;
  date?: string;
  updatedAt: string;
  _version: number;
}

export interface ExpenseResponse {
  _id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidByName?: string;
  splitAmong: string[];
  splitAmount: number;
  category: string | null;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
}

// ─── Settlement API ──────────────────────────────────────
export interface CreateSettlementRequest {
  payer: string;
  payee: string;
  amount: number;
  note?: string;
  date: string;
}

export interface SettlementResponse {
  _id: string;
  groupId: string;
  payer: string;
  payerName?: string;
  payee: string;
  payeeName?: string;
  amount: number;
  note: string | null;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
}

export interface BalanceEntry {
  memberId: string;
  name: string;
  netBalance: number; // positive = owed money, negative = owes money
}

export interface TransferSuggestion {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface SettlementsOverview {
  recorded: SettlementResponse[];
  calculated: TransferSuggestion[];
  balances: BalanceEntry[];
}

// ─── Sync API ────────────────────────────────────────────
export type SyncOperation = "create" | "update" | "delete";
export type SyncCollection =
  | "groups"
  | "members"
  | "expenses"
  | "settlements";

export interface SyncOperationPayload {
  collection: SyncCollection;
  operation: SyncOperation;
  documentId: string;
  tempId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SyncRequest {
  operations: SyncOperationPayload[];
}

export type SyncResultStatus = "ok" | "conflict" | "error";

export interface SyncResult {
  index: number;
  status: SyncResultStatus;
  tempId?: string;
  serverId?: string;
  serverDocument?: Record<string, unknown>;
  updatedAt?: string;
  _version?: number;
  message?: string;
}

export interface SyncResponse {
  results: SyncResult[];
}

// ─── Share API ───────────────────────────────────────────
export interface CreateShareRequest {
  expiresInDays?: number;
}

export interface ShareResponse {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
}

export interface PublicDashboardData {
  group: { name: string; currency: string };
  members: MemberResponse[];
  expenses: ExpenseResponse[];
  settlements: SettlementsOverview;
}
