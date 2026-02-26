"use client";

import { useState } from "react";
import { Share2, Copy, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { APP_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface ShareToken {
  _id: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

interface ShareDialogProps {
  groupId: string;
}

export function ShareDialog({ groupId }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/share`);
      if (res.ok) setTokens(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadTokens();
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInHours }),
      });
      if (res.ok) {
        await loadTokens();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to create link");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm("Revoke this share link?")) return;
    await fetch(`/api/groups/${groupId}/share/${tokenId}`, {
      method: "DELETE",
    });
    setTokens((prev) => prev.filter((t) => t._id !== tokenId));
  };

  const handleCopy = async (token: string, id: string) => {
    const url = `${APP_URL}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Share2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a read-only public link to share this group&apos;s
              expenses.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value={24}>Expires in 24 hours</option>
                <option value={72}>Expires in 72 hours</option>
                <option value={168}>Expires in 7 days</option>
              </select>
              <Button onClick={handleCreate} disabled={creating} size="sm">
                {creating ? "Creating…" : "Create Link"}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : tokens.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Active Links
                </p>
                {tokens.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t.expiresAt
                        ? `Expires ${formatDate(t.expiresAt)}`
                        : "No expiry"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(t.token, t._id)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Copy link"
                      >
                        {copiedId === t._id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRevoke(t._id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Revoke link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
