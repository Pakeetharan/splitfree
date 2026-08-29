"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, SearchX, Users } from "lucide-react";
import { MemberCard } from "@/components/members/member-card";
import { AddMemberForm } from "@/components/members/add-member-form";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q),
    );
  }, [members, search]);

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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-secondary">
            <Users className="h-4 w-4 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOwner && <AddMemberForm groupId={groupId} onAdded={refresh} />}
      </div>

      {members.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="pl-9"
            aria-label="Search members"
          />
        </div>
      )}

      {/* Member cards */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-primary px-6 py-12 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-muted">
            No members yet
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Add your first member to get started.
          </p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-primary px-6 py-12 text-center">
          <SearchX className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-muted">
            No members match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              groupId={groupId}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onRemove={handleRemove}
              onEdited={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
