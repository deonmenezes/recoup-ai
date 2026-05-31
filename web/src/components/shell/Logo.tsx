import { cn } from "@/lib/cn";

/** Recoup AI brand mark — a rising "recovery" arc inside a rounded shield,
 *  expressing compliant collections that trend upward. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="rc-logo" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b7cff" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5c5.5 2.4 10.2 3.4 14 3.4.6 6.2.2 19.6-14 28.6C5.8 25.5 5.4 12.1 6 5.9c3.8 0 8.5-1 14-3.4Z"
        fill="url(#rc-logo)"
      />
      <path
        d="M13 24.5l5-6 4 3.6 5.5-7.1"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27.5" cy="14.9" r="1.7" fill="white" />
    </svg>
  );
}

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={30} />
      <div className="leading-none">
        <span className={cn("text-[15px] font-bold tracking-tight", dark ? "text-white" : "text-ink")}>
          Recoup<span className="text-nav-accent"> AI</span>
        </span>
        <span className={cn("block text-[10px] font-medium tracking-wide", dark ? "text-nav-ink" : "text-subtle")}>
          Collections CRM
        </span>
      </div>
    </div>
  );
}
