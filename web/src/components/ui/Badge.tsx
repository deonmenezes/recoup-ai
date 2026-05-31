import type { Tone } from "@/lib/data";
import { STATUS_META, RISK_META } from "@/lib/data";
import type { DebtorStatus, RiskTier } from "@/lib/types";
import { cn } from "@/lib/cn";
import { TONES } from "./tones";

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone].soft,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONES[tone].dot)} aria-hidden />}
      {children}
    </span>
  );
}

/** Status pill conveys meaning by label + dot, never color alone (a11y P1). */
export function StatusPill({ status, className }: { status: DebtorStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function RiskPill({ risk, className }: { risk: RiskTier; className?: string }) {
  const meta = RISK_META[risk];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", TONES[meta.tone].text, className)}>
      <span className={cn("size-1.5 rounded-full", TONES[meta.tone].dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

export function Dot({ tone = "neutral", className, pulse }: { tone?: Tone; className?: string; pulse?: boolean }) {
  return (
    <span className={cn("relative inline-flex size-2 rounded-full", TONES[tone].dot, className)} aria-hidden>
      {pulse && (
        <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", TONES[tone].dot)} />
      )}
    </span>
  );
}
