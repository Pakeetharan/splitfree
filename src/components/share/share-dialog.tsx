"use client";

import { useState } from "react";
import { Share2, Copy, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
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
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();

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
        toast("Link created", "success");
      } else {
        const data = await res.json();
        const message = data.error ?? "Failed to create link";
        setError(message);
        toast(message, "error");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/share/${revokeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t._id !== revokeId));
        toast("Link revoked", "success");
      } else {
        toast("Failed to revoke link", "error");
      }
    } finally {
      setRevoking(false);
      setRevokeId(null);
    }
  };

  const handleCopy = async (token: string, id: string) => {
    const url = `${APP_URL}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast("Link copied", "success");
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
            <p className="text-sm text-text-muted">
              Create a read-only public link to share this group&apos;s
              expenses.
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="flex-1"
              >
                <option value={24}>Expires in 24 hours</option>
                <option value={72}>Expires in 72 hours</option>
                <option value={168}>Expires in 7 days</option>
              </Select>
              <Button onClick={handleCreate} isLoading={creating} size="sm">
                Create Link
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : tokens.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Active Links
                </p>
                {tokens.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-lg border border-border-primary px-3 py-2"
                  >
                    <div className="text-xs text-text-muted">
                      {t.expiresAt
                        ? `Expires ${formatDate(t.expiresAt)}`
                        : "No expiry"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(t.token, t._id)}
                        aria-label="Copy link"
                      >
                        {copiedId === t._id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-text-muted" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeId(t._id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        aria-label="Revoke link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {/* Revoke confirmation dialog */}
      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Revoke Link"
        description="Are you sure you want to revoke this share link? Anyone using it will lose access immediately."
        confirmLabel="Revoke"
        variant="danger"
        loading={revoking}
        onConfirm={handleRevoke}
      />
    </>
  );
}
