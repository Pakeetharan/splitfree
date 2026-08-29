"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top-of-page progress bar for App Router navigations.
 * Server components can take a beat to fetch data before rendering, and
 * without this there is no feedback at all between clicking a link and the
 * new page appearing. Starts eagerly on internal link clicks, completes
 * when the pathname/search params actually change.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const growTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (growTimer.current) clearInterval(growTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    }

    function start() {
      clearTimers();
      setVisible(true);
      setProgress(12);
      growTimer.current = setInterval(() => {
        setProgress((p) => (p >= 88 ? p : p + (88 - p) * 0.15));
      }, 180);
      // Safety net: same-route clicks or intercepted navigations never
      // change the URL, so force-complete instead of hanging forever.
      fallbackTimer.current = setTimeout(() => finish(), 4000);
    }

    function finish() {
      clearTimers();
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }

    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTimers();
    };
  }, []);

  // Navigation landed — complete and hide the bar.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const prevRouteKey = useRef(routeKey);
  useEffect(() => {
    if (prevRouteKey.current === routeKey) return;
    prevRouteKey.current = routeKey;
    if (growTimer.current) clearInterval(growTimer.current);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    const complete = setTimeout(() => setProgress(100), 0);
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
    return () => {
      clearTimeout(complete);
      clearTimeout(hide);
    };
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      aria-hidden="true"
    >
      <div
        className="h-full bg-accent transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
