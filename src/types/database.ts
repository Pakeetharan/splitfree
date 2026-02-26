import { ObjectId } from "mongodb";

// ─── Users ───────────────────────────────────────────────
export interface DbUser {
  _id: ObjectId;
  supabaseId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  _version: number;
  deletedAt: Date | null;
}

// ─── Groups ──────────────────────────────────────────────
export interface DbGroup {
  _id: ObjectId;
  name: string;
  description: string | null;
  currency: string; // ISO 4217
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  _version: number;
  deletedAt: Date | null;
}

// ─── Members ─────────────────────────────────────────────
export type MemberRole = "owner" | "member";

export interface DbMember {
  _id: ObjectId;
  groupId: ObjectId;
  userId: ObjectId | null; // null for virtual members
  name: string;
  email: string | null;
  role: MemberRole;
  isVirtual: boolean;
  createdAt: Date;
  updatedAt: Date;
  _version: number;
  deletedAt: Date | null;
}

// ─── Expenses ────────────────────────────────────────────
export interface DbExpense {
  _id: ObjectId;
  groupId: ObjectId;
  description: string;
  amount: number; // stored as integer cents
  currency: string;
  paidBy: ObjectId; // members._id
  splitAmong: ObjectId[]; // members._id[]
  splitAmount: number; // computed: floor(amount / splitAmong.length)
  category: string | null;
  date: Date;
  createdBy: ObjectId; // users._id
  createdAt: Date;
  updatedAt: Date;
  _version: number;
  deletedAt: Date | null;
  _tempId?: string; // for offline sync idempotency
}

// ─── Settlements ─────────────────────────────────────────
export interface DbSettlement {
  _id: ObjectId;
  groupId: ObjectId;
  payer: ObjectId; // members._id
  payee: ObjectId; // members._id
  amount: number; // integer cents
  note: string | null;
  date: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  _version: number;
  deletedAt: Date | null;
  _tempId?: string;
}

// ─── Share Tokens ────────────────────────────────────────
export interface DbShareToken {
  _id: ObjectId;
  token: string;
  groupId: ObjectId;
  createdBy: ObjectId;
  expiresAt: Date | null;
  createdAt: Date;
  isRevoked: boolean;
}
