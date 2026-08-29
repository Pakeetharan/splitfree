"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "./user-menu";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show nav on public pages
  const isAuthPage = pathname === "/login" || pathname === "/";
  const isDashboardActive = pathname === "/dashboard";
  const isGroupsActive = pathname.startsWith("/dashboard/groups");

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: isDashboardActive,
    },
    {
      href: "/dashboard/groups",
      label: "Groups",
      icon: FolderOpen,
      active: isGroupsActive,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-surface-primary/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="SplitFree"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-dark.svg"
              alt="SplitFree"
              className="hidden h-8 w-auto dark:block"
            />
          </Link>

          {/* Desktop navigation */}
          {!isAuthPage && (
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                    item.active
                      ? "text-accent"
                      : "text-text-muted hover:text-gray-900 dark:hover:text-gray-100",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {/* Active indicator — bottom bar */}
                  {item.active && (
                    <span className="absolute -bottom-4.25 left-0 right-0 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: CTA + sync + user menu */}
        {!isAuthPage && (
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <Link
              href="/dashboard/groups/new"
              className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              New Group
            </Link>
            <ThemeToggle />
            <SyncIndicator />
            <UserMenu />
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 text-text-muted hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:hidden dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile navigation sheet */}
      {!isAuthPage && mobileOpen && (
        <div className="border-t border-border-subtle bg-surface-primary px-4 pb-4 pt-2 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-900",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard/groups/new"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New Group
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
