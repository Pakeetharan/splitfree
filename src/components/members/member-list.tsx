"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { MemberCard } from "@/components/members/member-card";
import { AddMemberForm } from "@/components/members/add-member-form";
import type { MemberResponse } from "@/types/api";

interface MemberListProps {
  groupId: string;
  currentUserId: string;
  isOwner: boolean;
  initialMembers: MemberResponse[];
}

export function MemberList({
  groupId,
  currentUserId,
  isOwner,
  initialMembers,
}: MemberListProps) {
  const [members, setMembers] = useState<MemberResponse[]>(initialMembers);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`);
      if (res.ok) {
        const data: MemberResponse[] = await res.json();
        setMembers(data);
      }
    } catch {
      // silent
    }
  }, [groupId]);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleRemove = async (memberId: string) => {
    const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
    }
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOwner && <AddMemberForm groupId={groupId} onAdded={refresh} />}
      </div>

      {/* Member cards */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No members yet
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Add your first member to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
