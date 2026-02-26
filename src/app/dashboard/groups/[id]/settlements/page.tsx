import { notFound } from "next/navigation";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { listSettlements } from "@/lib/services/settlement.service";
import { listMembers } from "@/lib/services/member.service";
import { GroupPageShell } from "@/components/groups/group-page-shell";
import { SettlementsClient } from "@/components/settlements/settlements-client";
import { serializeDoc } from "@/lib/utils";
import type { SettlementResponse, MemberResponse } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const user = await getPageAuthUser();
    const group = await getGroup(user.id, id);
    return { title: `Settlements — ${group.name}` };
  } catch {
    return { title: "Settlements" };
  }
}

export default async function SettlementsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getPageAuthUser();

  let group;
  let initialSettlements: SettlementResponse[];
  let members: MemberResponse[];

  try {
    group = await getGroup(user.id, id);
    const [settlementDocs, memberDocs] = await Promise.all([
      listSettlements(user.id, id),
      listMembers(user.id, id),
    ]);
    initialSettlements = settlementDocs.map(serializeDoc);
    members = memberDocs.map(serializeDoc);
  } catch {
    notFound();
  }

  const groupId = group._id.toHexString();
  const isOwner = group.createdBy.toHexString() === user.id;
  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  return (
    <GroupPageShell
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      currencyCode={group.currency}
    >
      <SettlementsClient
        groupId={id}
        currency={group.currency}
        currentUserId={user.id}
        isOwner={isOwner}
        memberMap={memberMap}
        members={members}
        initialSettlements={initialSettlements}
      />
    </GroupPageShell>
  );
}
