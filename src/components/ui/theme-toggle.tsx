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
    return <div className="h-8 w-8" aria-hidden />;
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
      className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
