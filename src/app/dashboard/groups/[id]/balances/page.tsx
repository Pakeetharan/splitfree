import { notFound } from "next/navigation";
import { getPageAuthUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/group.service";
import { computeBalances } from "@/lib/engine/balance-calculator";
import { computeOptimalSettlements } from "@/lib/engine/settlement-optimizer";
import { listMembers } from "@/lib/services/member.service";
import { GroupPageShell } from "@/components/groups/group-page-shell";
import { BalancesClient } from "@/components/settlements/balances-client";
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
    return { title: `Balances — ${group.name}` };
  } catch {
    return { title: "Balances" };
  }
}

export default async function BalancesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getPageAuthUser();

  let group;
  let balances;
  let suggestions;
  let members: MemberResponse[];

  try {
    group = await getGroup(user.id, id);
    const [b, s, memberDocs] = await Promise.all([
      computeBalances(user.id, id),
      computeBalances(user.id, id).then(computeOptimalSettlements),
      listMembers(user.id, id),
    ]);
    balances = b;
    suggestions = s;
    members = memberDocs.map(serializeDoc);
  } catch {
    notFound();
  }

  const groupId = group._id.toHexString();
  const isOwner = group.createdBy.toHexString() === user.id;

  return (
    <GroupPageShell
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      currencyCode={group.currency}
    >
      <BalancesClient
        groupId={id}
        currency={group.currency}
        members={members}
        currentUserId={user.id}
        isOwner={isOwner}
        initialBalances={balances}
        initialSuggestions={suggestions}
      />
    </GroupPageShell>
  );
}
