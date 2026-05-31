"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, RotateCcw, Sparkles } from "lucide-react";
import { activeNav } from "@/lib/nav";
import { IconButton } from "@/components/ui/Button";
import { CallMeButton } from "@/components/call/CallMeDialog";
import { resetDemo } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = activeNav(pathname);
  const [q, setQ] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/accounts?q=${encodeURIComponent(q.trim())}` : "/accounts");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <IconButton label="Open navigation" size="sm" onClick={onMenu} className="lg:hidden">
        <Menu className="size-5" />
      </IconButton>

      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        <span className="text-sm font-semibold text-ink">{active?.label ?? "Recoup AI"}</span>
        {active?.description && (
          <>
            <span className="text-faint">·</span>
            <span className="hidden truncate text-[13px] text-subtle md:inline">{active.description}</span>
          </>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <form onSubmit={onSearch} className="relative hidden sm:block w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts…"
            aria-label="Search accounts"
            className={cn(
              "h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-ink",
              "placeholder:text-subtle focus:border-primary focus:bg-surface focus:outline-none",
            )}
          />
        </form>

        <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary lg:inline-flex">
          <Sparkles className="size-3.5" />
          Demo data
        </span>

        <CallMeButton size="sm" label="Call me" />

        <IconButton
          label="Reset demo data"
          size="sm"
          variant="secondary"
          onClick={() => {
            resetDemo();
            toast.info("Demo reset", "All accounts, calls, and promises restored to seed.");
          }}
        >
          <RotateCcw className="size-4" />
        </IconButton>
      </div>
    </header>
  );
}
