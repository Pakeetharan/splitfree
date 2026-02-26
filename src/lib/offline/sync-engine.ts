/**
 * Sync engine — sends pending queue items to the server.
 * Client-side only.
 */
import { getDb } from "./db";
import {
  getPendingItems,
  markSyncing,
  markDone,
  markFailed,
} from "./sync-queue";
import { MAX_SYNC_BATCH_SIZE } from "@/lib/constants";

export type SyncState = "idle" | "syncing" | "error";

let _isSyncing = false;
const _listeners = new Set<(state: SyncState) => void>();

export function onSyncStateChange(cb: (state: SyncState) => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function notify(state: SyncState) {
  _listeners.forEach((cb) => cb(state));
}

export async function syncNow(): Promise<void> {
  if (_isSyncing) return;
  _isSyncing = true;
  notify("syncing");

  try {
    const pending = await getPendingItems();
    if (pending.length === 0) {
      notify("idle");
      return;
    }

    // Process in batches
    const batch = pending.slice(0, MAX_SYNC_BATCH_SIZE);
    const ids = batch.map((item) => item.id!);

    await markSyncing(ids);

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations: batch }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      for (const item of batch) {
        await markFailed(item.id!, errorText);
      }
      notify("error");
      return;
    }

    const result: { applied: string[]; failed: { tempId: string; error: string }[] } =
      await res.json();

    for (const item of batch) {
      const failed = result.failed?.find((f) => f.tempId === item.tempId);
      if (failed) {
        await markFailed(item.id!, failed.error);
      }
    }

    const successfulIds = batch
      .filter((item) => !result.failed?.find((f) => f.tempId === item.tempId))
      .map((item) => item.id!);

    await markDone(successfulIds);

    // Refresh local cache from server after sync
    await refreshLocalCache();

    notify("idle");
  } catch (err) {
    console.error("[SyncEngine]", err);
    notify("error");
  } finally {
    _isSyncing = false;
  }
}

/**
 * Refresh the local IndexedDB cache from the server.
 * Called after a successful sync to ensure consistency.
 */
async function refreshLocalCache(): Promise<void> {
  try {
    const db = await getDb();

    // Fetch all groups
    const groupsRes = await fetch("/api/groups");
    if (groupsRes.ok) {
      const groups = await groupsRes.json();
      await db.groups.bulkPut(groups);
    }
  } catch (err) {
    console.warn("[SyncEngine] Cache refresh failed:", err);
  }
}

/**
 * Initialize sync triggers. Call once in a client-side provider.
 */
export function initSyncTriggers() {
  if (typeof window === "undefined") return;

  // Sync on reconnect
  window.addEventListener("online", () => {
    syncNow();
  });

  // iOS Safari fallback: sync when page becomes visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncNow();
    }
  });
}
