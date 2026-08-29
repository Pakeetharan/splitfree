"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSyncExternalStore } from "react";

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return <div className="h-11 w-11" aria-hidden />;
  }

  const currentIdx = options.findIndex((o) => o.value === theme);
  const current = options[currentIdx === -1 ? 2 : currentIdx];
  const Icon = current.icon;

  function cycle() {
    const next = options[(currentIdx + 1) % options.length];
    setTheme(next.value);
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${current.label} — click to cycle`}
      aria-label={`Current theme: ${current.label}. Click to switch theme.`}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
