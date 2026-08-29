"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const activeIndex = tabs.findIndex((tab) => {
    const href = basePath + tab.suffix;
    return tab.suffix === "" ? pathname === basePath : pathname.startsWith(href);
  });

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeIndex, pathname]);

  return (
    <div className="relative border-b border-gray-200 dark:border-gray-800">
      <nav
        className="-mb-px flex gap-1 overflow-x-auto px-1 scrollbar-none"
        aria-label="Group navigation"
      >
        {tabs.map((tab, i) => {
          const href = basePath + tab.suffix;
          const isActive = i === activeIndex;

          return (
            <Link
              key={tab.suffix}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              href={href}
              className={cn(
                "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {/* Sliding active indicator */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400",
          indicator ? "transition-all duration-[220ms] ease-out" : "opacity-0",
        )}
        style={
          indicator
            ? { left: indicator.left, width: indicator.width }
            : undefined
        }
      />
    </div>
  );
}
