"use client";

import {
  Users,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface Step {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  bg: string;
}

const STEPS: Step[] = [
  {
    icon: <Users className="size-5" aria-hidden />,
    label: "Personas",
    sub: "8 adversarial debtor profiles",
    color: "text-primary",
    bg: "bg-primary-soft",
  },
  {
    icon: <PhoneCall className="size-5" aria-hidden />,
    label: "Place Calls",
    sub: "Riley handles each call live",
    color: "text-info-ink",
    bg: "bg-info-soft",
  },
  {
    icon: <ShieldCheck className="size-5" aria-hidden />,
    label: "Grade",
    sub: "FDCPA compliance + effectiveness",
    color: "text-warning-ink",
    bg: "bg-warning-soft",
  },
  {
    icon: <Sparkles className="size-5" aria-hidden />,
    label: "Claude Edits",
    sub: "Auto-hardens the agent prompt",
    color: "text-success-ink",
    bg: "bg-success-soft",
  },
  {
    icon: <RefreshCw className="size-5" aria-hidden />,
    label: "Redeploy",
    sub: "Re-runs until 100% compliant",
    color: "text-primary",
    bg: "bg-primary-softer",
  },
];

export function LoopDiagram() {
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle mb-4">
        Self-Improvement Loop
      </p>
      <div className="flex items-start gap-0 flex-wrap md:flex-nowrap">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-0 flex-1 min-w-[140px]">
            <div className="flex flex-col items-center gap-2 text-center flex-1 py-1">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl shadow-xs",
                  step.bg,
                  step.color,
                )}
              >
                {step.icon}
              </div>
              <p className="text-xs font-semibold text-ink leading-tight">{step.label}</p>
              <p className="text-[11px] text-subtle leading-tight text-pretty max-w-[100px]">{step.sub}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className="size-4 text-faint shrink-0 -mt-3 mx-1"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
