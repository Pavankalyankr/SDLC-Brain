"use client";

/**
 * SDLC Brain — Navigation Progress Bar
 *
 * Shows a thin progress bar at the top of the page during
 * Next.js route transitions, giving instant visual feedback.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // Only trigger when path actually changed
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    // Reset previous timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Complete the bar
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [pathname, searchParams]);

  // Start the bar immediately on click via link interception
  useEffect(() => {
    const handleStart = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setVisible(true);
      setProgress(10);

      // Slowly increment to 85% to simulate progress
      let p = 10;
      intervalRef.current = setInterval(() => {
        p = Math.min(p + (85 - p) * 0.15, 85);
        setProgress(p);
      }, 200);
    };

    // Intercept clicks on anchor tags to start progress immediately
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest("a[href]");
      if (!target) return;
      const href = (target as HTMLAnchorElement).href;
      if (!href || href.startsWith("#") || href.includes("mailto:")) return;
      // Only for same-origin internal links
      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
        handleStart();
      } catch {}
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms" }}
    >
      <div
        className="h-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease-out" : "width 200ms linear",
        }}
      />
    </div>
  );
}
