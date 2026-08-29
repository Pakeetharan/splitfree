"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { GroupForm } from "@/components/groups/group-form";
import { ShareDialog } from "@/components/share/share-dialog";
import { ExportButton } from "@/components/groups/export-button";
import { Button } from "@/components/ui/button";
import type { GroupResponse } from "@/types/api";

export default function GroupSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/${id}`);
        if (!res.ok) throw new Error("Failed to load group");
        const data: GroupResponse = await res.json();
        setGroup(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [id]);

  async function handleSubmit(data: {
    name: string;
    description: string;
    currency: string;
  }) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, _version: group!._version }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to update group (${res.status})`,
        );
      }

      const updated: GroupResponse = await res.json();
      setGroup(updated);
      router.push(`/dashboard/groups/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to delete group (${res.status})`,
        );
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-text-muted">
        Loading group settings…
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Group not found"}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/dashboard/groups/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Group
      </Link>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">Group Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Update your group details or delete the group.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Edit form */}
      <GroupForm
        onSubmit={handleSubmit}
        isLoading={saving}
        defaultValues={{
          name: group.name,
          description: group.description ?? "",
          currency: group.currency,
        }}
        submitLabel="Save Changes"
      />

      {/* Share & Export */}
      <div className="rounded-xl border border-border-primary">
        <div className="border-b border-border-primary px-4 py-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            Share &amp; Export
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Share group view</p>
            <p className="text-xs text-text-muted">
              Create a read-only link for people without accounts.
            </p>
          </div>
          <ShareDialog groupId={id} />
        </div>
        <div className="flex flex-col gap-4 border-t border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Export to Excel</p>
            <p className="text-xs text-text-muted">
              Download all expenses and settlements as an XLSX file.
            </p>
          </div>
          <ExportButton groupId={id} groupName={group.name} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-800">
        <div className="border-b border-red-200 px-4 py-3 dark:border-red-800">
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
            Danger Zone
          </h2>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium">Delete this group</p>
            <p className="text-xs text-text-muted">
              Permanently remove this group and all its data.
            </p>
          </div>
          <Button
            onClick={handleDelete}
            isLoading={deleting}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4" />
            Delete Group
          </Button>
        </div>
      </div>
    </div>
  );
}
