"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Context-aware Floating Action Button.
 * - Dashboard → New Group
 * - Group page → Add Expense
 * - Expenses list → Add Expense
 * Hidden on desktop (header CTA handles it).
 */
export function FAB() {
  const pathname = usePathname();

  // Determine action based on current route
  const groupMatch = pathname.match(/^\/dashboard\/groups\/([a-f0-9]{24})/);

  let href: string;
  let label: string;

  if (groupMatch) {
    // Inside a group → Add Expense
    const groupId = groupMatch[1];
    href = `/dashboard/groups/${groupId}/expenses/new`;
    label = "Add expense";
  } else {
    // Dashboard or groups list → New Group
    href = "/dashboard/groups/new";
    label = "New group";
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95 sm:hidden"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
