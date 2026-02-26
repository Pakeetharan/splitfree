"use client";

import { ShareDialog } from "@/components/share/share-dialog";
import { ExportButton } from "@/components/groups/export-button";

interface GroupHeaderActionsProps {
  groupId: string;
  groupName: string;
}

export function GroupHeaderActions({
  groupId,
  groupName,
}: GroupHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ShareDialog groupId={groupId} />
      <ExportButton groupId={groupId} groupName={groupName} />
    </div>
  );
}
