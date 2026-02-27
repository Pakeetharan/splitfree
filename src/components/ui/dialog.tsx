"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  /** Controlled open state (Radix-style) */
  open?: boolean;
  /** Controlled open-change handler (Radix-style) */
  onOpenChange?: (open: boolean) => void;
  /** Legacy open state */
  isOpen?: boolean;
  /** Legacy close handler */
  onClose?: () => void;
  /** Optional title rendered in the dialog header */
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  const visible = open ?? isOpen ?? false;

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel — flex column so header stays fixed and body scrolls */}
      <div className="relative z-10 mx-4 flex w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950" style={{ maxHeight: "90dvh" }}>
        {/* Fixed header */}
        <div className="shrink-0 px-6 pt-6 pb-0">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          {/* Title rendered via prop (legacy API) */}
          {title && (
            <div className="mb-4 pr-8">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Scrollable body — min-h-0 is required so flex-1 can shrink and scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components (Radix-compatible API) ────────────────

export function DialogContent({ children }: { children: ReactNode }) {
  // Transparent wrapper — Dialog renders the panel; children go directly inside
  return <>{children}</>;
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 pr-8">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  );
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
