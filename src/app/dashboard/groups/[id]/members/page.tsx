import { notFound } from "next/navigation";
import { getPageAuthUser } from "@/lib/auth";
import { listMembers } from "@/lib/services/member.service";
import { getGroup } from "@/lib/services/group.service";
import { GroupPageShell } from "@/components/groups/group-page-shell";
import { MemberList } from "@/components/members/member-list";
import { serializeDoc } from "@/lib/utils";
import type { MemberResponse } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const user = await getPageAuthUser();
    const group = await getGroup(user.id, id);
    return { title: `Members — ${group.name}` };
  } catch {
    return { title: "Members" };
  }
}

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getPageAuthUser();

  let group;
  let memberDocs;
  try {
    group = await getGroup(user.id, id);
    memberDocs = await listMembers(user.id, id);
  } catch {
    notFound();
  }

  const groupId = group._id.toHexString();
  const isOwner = group.createdBy.toHexString() === user.id;
  const members: MemberResponse[] = memberDocs.map(serializeDoc);

  return (
    <GroupPageShell
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      currencyCode={group.currency}
    >
      <MemberList
        groupId={id}
        currentUserId={user.id}
        isOwner={isOwner}
        initialMembers={members}
      />
    </GroupPageShell>
  );
}
