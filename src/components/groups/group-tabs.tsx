"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface GroupTabsProps {
  groupId: string;
}

const tabs = [
  { label: "Overview", suffix: "" },
  { label: "Members", suffix: "/members" },
  { label: "Expenses", suffix: "/expenses" },
  { label: "Balances", suffix: "/balances" },
  { label: "Settlements", suffix: "/settlements" },
];

export function GroupTabs({ groupId }: GroupTabsProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/groups/${groupId}`;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <nav
        className="-mb-px flex gap-1 overflow-x-auto px-1 scrollbar-none"
        aria-label="Group navigation"
      >
        {tabs.map((tab) => {
          const href = basePath + tab.suffix;
          // Match exactly for overview, prefix for sub-pages
          const isActive =
            tab.suffix === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.suffix}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
