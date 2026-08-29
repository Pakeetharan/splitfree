"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  groupId: string;
  groupName: string;
  size?: "sm" | "md" | "lg";
  format?: "xlsx" | "csv";
  label?: string;
}

export function ExportButton({
  groupId,
  groupName,
  size = "sm",
  format = "xlsx",
  label = "Export",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/export?format=${format}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Export failed (${res.status})`);
      }

      // Stream response to download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeName = groupName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      anchor.href = url;
      anchor.download = `${safeName}-expenses.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size={size}
        onClick={handleExport}
        isLoading={loading}
      >
        <svg
          className="h-4 w-4 sm:mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="hidden sm:inline">{label}</span>
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
