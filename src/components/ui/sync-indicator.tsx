"use client";

import { useOnlineStatus, useSyncStatus } from "@/lib/offline/hooks";
import { syncNow } from "@/lib/offline/sync-engine";
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { syncState, pendingCount } = useSyncStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <WifiOff className="h-3.5 w-3.5" />
        <span>Offline</span>
      </div>
    );
  }

  if (syncState === "syncing") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Syncing…</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={() => syncNow()}
        className="flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
        title="Click to sync now"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>{pendingCount} pending</span>
      </button>
    );
  }

  return null;
}
