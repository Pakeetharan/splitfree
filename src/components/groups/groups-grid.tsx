"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GroupCard } from "@/components/groups/group-card";

interface GroupItem {
  _id: string;
  name: string;
  description: string | null;
  currency: string;
  memberCount?: number;
  createdAt: string;
  myBalance?: number;
  lastActivityAt?: string | null;
}

interface GroupsGridProps {
  groups: GroupItem[];
}

export function GroupsGrid({ groups }: GroupsGridProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q),
    );
  }, [groups, search]);

  return (
    <div className="space-y-4">
      {groups.length > 1 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="pl-9"
            aria-label="Search groups"
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard key={group._id} group={group} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-primary px-6 py-12 text-center">
          <SearchX className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-muted">
            No groups match &quot;{search}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
