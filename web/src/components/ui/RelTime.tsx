"use client";

import { useEffect, useState } from "react";
import { relativeTime, shortDate } from "@/lib/format";

/**
 * Hydration-safe relative timestamp. Renders a deterministic absolute date on
 * the server and the first client render (so SSR === first paint), then upgrades
 * to a live "2h ago" relative string after mount. Avoids React #418 text
 * mismatches that arise from calling Date.now() during render.
 */
export function RelTime({ iso, className }: { iso?: string | null; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!iso) return <span className={className}>—</span>;

  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? relativeTime(iso) : shortDate(iso)}
    </span>
  );
}
