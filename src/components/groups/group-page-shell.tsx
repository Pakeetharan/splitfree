import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { GroupHeaderActions } from "@/components/groups/group-header-actions";
import { GroupTabs } from "@/components/groups/group-tabs";
import { CURRENCIES } from "@/lib/constants";

interface GroupPageShellProps {
  groupId: string;
  groupName: string;
  groupDescription?: string | null;
  currencyCode: string;
  children: React.ReactNode;
}

export function GroupPageShell({
  groupId,
  groupName,
  groupDescription,
  currencyCode,
  children,
}: GroupPageShellProps) {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const currencyLabel = currency
    ? `${currency.symbol} ${currency.code}`
    : currencyCode;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Groups
        </Link>
      </div>

      {/* Group header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{groupName}</h1>
          {groupDescription && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {groupDescription}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Currency: {currencyLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GroupHeaderActions groupId={groupId} groupName={groupName} />
          <Link
            href={`/dashboard/groups/${groupId}/settings`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Group settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mt-4">
        <GroupTabs groupId={groupId} />
      </div>

      {/* Page content */}
      <div className="mt-6">{children}</div>
    </div>
  );
}
