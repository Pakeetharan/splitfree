/**
 * SyncQueue management — add, mark, prune, etc.
 * Client-side only.
 */
import { getDb, type SyncQueueItem, type SyncOperation, type SyncEntity } from "./db";

const MAX_QUEUE_SIZE = 500;
const WARN_QUEUE_SIZE = 400;

export async function getQueueSize(): Promise<number> {
  const db = await getDb();
  return db.syncQueue.where("status").anyOf(["pending", "failed"]).count();
}

export async function enqueue(
  item: Omit<SyncQueueItem, "id" | "createdAt" | "updatedAt" | "retries" | "status">,
): Promise<void> {
  const db = await getDb();
  const size = await getQueueSize();

  if (size >= MAX_QUEUE_SIZE) {
    throw new Error(
      `Sync queue is full (${MAX_QUEUE_SIZE} items). Please connect to the internet to sync.`,
    );
  }

  if (size >= WARN_QUEUE_SIZE) {
    console.warn(`[SyncQueue] Warning: queue approaching limit (${size}/${MAX_QUEUE_SIZE})`);
  }

  const now = new Date().toISOString();
  await db.syncQueue.add({
    ...item,
    createdAt: now,
    updatedAt: now,
    retries: 0,
    status: "pending",
  });
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return db.syncQueue
    .where("status")
    .anyOf(["pending", "failed"])
    .sortBy("createdAt");
}

export async function markSyncing(ids: number[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.syncQueue.bulkUpdate(
    ids.map((id) => ({ key: id, changes: { status: "syncing", updatedAt: now } })),
  );
}

export async function markDone(ids: number[]): Promise<void> {
  const db = await getDb();
  await db.syncQueue.bulkDelete(ids);
}

export async function markFailed(
  id: number,
  errorMessage: string,
): Promise<void> {
  const db = await getDb();
  const item = await db.syncQueue.get(id);
  if (!item) return;
  const now = new Date().toISOString();
  await db.syncQueue.update(id, {
    status: "failed",
    retries: item.retries + 1,
    errorMessage,
    updatedAt: now,
  });
}

export async function clearQueue(): Promise<void> {
  const db = await getDb();
  await db.syncQueue.where("status").anyOf(["done", "failed"]).delete();
}
