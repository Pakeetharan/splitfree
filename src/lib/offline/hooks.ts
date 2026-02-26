"use client";

import { useEffect, useState } from "react";
import { onSyncStateChange, type SyncState } from "./sync-engine";

/**
 * Returns true when the browser has network connectivity.
 */
export function useOnlineStatus(): boolean {
  // Always start `true` so the server and the first client render match.
  // The real navigator.onLine value is applied in the effect after hydration.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Sync to actual browser state immediately after hydration
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Returns the current sync engine state and pending count.
 */
export function useSyncStatus(): {
  syncState: SyncState;
  pendingCount: number;
} {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSyncStateChange(setSyncState);
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkQueue() {
      try {
        const { getQueueSize } = await import("./sync-queue");
        const count = await getQueueSize();
        if (!cancelled) setPendingCount(count);
      } catch {
        // IndexedDB not available
      }
    }

    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [syncState]);

  return { syncState, pendingCount };
}
