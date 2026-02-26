"use client";

import { useState } from "react";
import { Trash2, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemberResponse } from "@/types/api";

interface MemberCardProps {
  member: MemberResponse;
  currentUserId: string;
  isOwner: boolean;
  onRemove?: (memberId: string) => void;
}

export function MemberCard({
  member,
  currentUserId,
  isOwner,
  onRemove,
}: MemberCardProps) {
  const [removing, setRemoving] = useState(false);
  const isSelf = member.userId === currentUserId;

  const handleRemove = async () => {
    if (!onRemove || removing) return;
    setRemoving(true);
    try {
      await onRemove(member._id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-purple-500 text-white overflow-hidden">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-sm font-semibold">
              {member.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {member.name}
            </span>
            {member.role === "owner" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Crown className="h-3 w-3" /> Owner
              </span>
            )}
            {member.isVirtual && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                <User className="h-3 w-3" /> Virtual
              </span>
            )}
            {isSelf && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                You
              </span>
            )}
          </div>
          {member.email && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {member.email}
            </p>
          )}
        </div>
      </div>

      {isOwner && !isSelf && member.role !== "owner" && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={removing}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          aria-label="Remove member"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
