"use client";

import { useOnlineStatus } from "@/lib/offline/hooks";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="animate-fade-in fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 transform"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
        <WifiOff className="h-4 w-4" />
        <span>You&apos;re offline — changes will sync when reconnected</span>
      </div>
    </div>
  );
}
