/**
 * Offline-first Dexie database for SplitFree.
 * Stores local copies of groups/members/expenses/settlements
 * plus a SyncQueue for pending operations.
 *
 * IMPORTANT: This module is client-side only.
 * Never import from server components or API routes.
 */

// We lazily import Dexie to avoid SSR issues in Next.js
// Usage: import { getDb } from '@/lib/offline/db'

export interface OfflineGroup {
  _id: string;
  name: string;
  description: string | null;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  deletedAt: string | null;
  _synced?: boolean;
}

export interface OfflineMember {
  _id: string;
  groupId: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: string;
  isVirtual: boolean;
  createdAt: string;
  updatedAt: string;
  _version: number;
  deletedAt: string | null;
  _synced?: boolean;
}

export interface OfflineExpense {
  _id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitAmong: string[];
  splitAmount: number;
  category: string | null;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  deletedAt: string | null;
  _tempId?: string;
  _synced?: boolean;
}

export interface OfflineSettlement {
  _id: string;
  groupId: string;
  payer: string;
  payee: string;
  amount: number;
  note: string | null;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  deletedAt: string | null;
  _tempId?: string;
  _synced?: boolean;
}

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncEntity = "group" | "member" | "expense" | "settlement";
export type SyncStatus = "pending" | "syncing" | "failed" | "done";

export interface SyncQueueItem {
  id?: number; // auto-increment
  tempId: string; // client-generated UUID
  operation: SyncOperation;
  entity: SyncEntity;
  entityId: string;
  groupId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  retries: number;
  status: SyncStatus;
  errorMessage?: string;
}

// ─── Lazy Dexie Instance ──────────────────────────────────

let _db: import("dexie").Dexie | null = null;

export async function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available on the server.");
  }

  if (_db) return _db as ReturnType<typeof createDb>;

  const { default: Dexie } = await import("dexie");

  function createDb() {
    const db = new Dexie("splitfree") as import("dexie").Dexie & {
      groups: import("dexie").Table<OfflineGroup, string>;
      members: import("dexie").Table<OfflineMember, string>;
      expenses: import("dexie").Table<OfflineExpense, string>;
      settlements: import("dexie").Table<OfflineSettlement, string>;
      syncQueue: import("dexie").Table<SyncQueueItem, number>;
    };

    db.version(1).stores({
      groups: "_id, deletedAt, updatedAt",
      members: "_id, groupId, userId, deletedAt",
      expenses: "_id, groupId, paidBy, deletedAt, date",
      settlements: "_id, groupId, payer, payee, deletedAt",
      syncQueue: "++id, status, entity, groupId, createdAt",
    });

    return db;
  }

  _db = createDb();
  return _db as ReturnType<typeof createDb>;
}
