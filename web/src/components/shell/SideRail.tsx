"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall, ShieldCheck } from "lucide-react";
import { NAV_ITEMS, activeNav } from "@/lib/nav";
import { CEKURA_RUN } from "@/lib/data";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

export function SideRail({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeNav(pathname);

  return (
    <nav
      className="flex h-full w-64 flex-col bg-nav text-nav-ink"
      style={{ background: "linear-gradient(180deg, var(--color-nav), var(--color-nav-2))" }}
      aria-label="Primary"
    >
      <div className="flex h-16 items-center px-5 border-b border-nav-border">
        <Link href="/" onClick={onNavigate} className="rounded-lg">
          <Logo dark />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-nav-ink/60">Workspace</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active?.href === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-nav-active text-nav-ink-active"
                      : "text-nav-ink hover:bg-nav-hover hover:text-nav-ink-active",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-nav-accent" aria-hidden />
                  )}
                  <Icon className={cn("size-[18px] shrink-0", isActive ? "text-nav-accent" : "text-nav-ink/70")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Agent status card */}
        <div className="mt-6 rounded-xl border border-nav-border bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-semibold text-nav-ink-active">Riley · live</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-nav-ink/70">{CEKURA_RUN.model}</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/15 px-2.5 py-1.5">
            <ShieldCheck className="size-4 text-success" />
            <span className="text-xs font-semibold text-white tnum">{CEKURA_RUN.finalScore}% compliant</span>
          </div>
        </div>
      </div>

      <div className="border-t border-nav-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            JL
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-nav-ink-active">Jordan Lee</p>
            <p className="truncate text-[11px] text-nav-ink/60">Collections Ops</p>
          </div>
          <PhoneCall className="size-4 text-nav-ink/50" />
        </div>
      </div>
    </nav>
  );
}
