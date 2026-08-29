"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name:
            data.user.user_metadata?.full_name ??
            data.user.email?.split("@")[0] ??
            "User",
          email: data.user.email ?? "",
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        });
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="h-11 w-11 animate-pulse rounded-full bg-surface-secondary" />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full p-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:hover:bg-gray-800"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-primary bg-surface-primary py-1 shadow-lg">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-sm font-medium text-text-primary">
              {user.name}
            </p>
            <p className="text-xs text-text-muted">
              {user.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
