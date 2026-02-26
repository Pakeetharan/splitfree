"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/lib/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";

export function InstallBanner() {
  const { isInstallable, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 transform px-4 sm:bottom-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-lg dark:border-blue-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Install SplitFree
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add to home screen for offline access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => triggerInstall()}>
            Install
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
