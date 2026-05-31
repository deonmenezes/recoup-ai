"use client";

import { CircleCheck, Wrench, Terminal } from "lucide-react";
import { SectionLabel, Divider } from "@/components/ui/primitives";
import { SCRIPT_STEPS, AGENT_TOOLS, COMPLIANCE_CHECKS } from "@/lib/data";
import { cn } from "@/lib/cn";

const COMPLIANCE_MAP = Object.fromEntries(COMPLIANCE_CHECKS.map((c) => [c.key, c]));

export function ScriptTab() {
  return (
    <div className="px-5 py-5 space-y-6">
      {/* Intro */}
      <div className="rounded-xl bg-primary-softer border border-primary/15 px-4 py-3.5">
        <p className="text-sm text-primary font-medium">
          This is the exact compliant flow Riley follows on every call — each step is gated by FDCPA compliance checks.
        </p>
      </div>

      {/* Steps */}
      <section>
        <SectionLabel className="mb-4">Call script steps</SectionLabel>
        <ol className="space-y-0">
          {SCRIPT_STEPS.map((step, i) => {
            const isLast = i === SCRIPT_STEPS.length - 1;
            const complianceCheck = step.compliance ? COMPLIANCE_MAP[step.compliance] : null;
            return (
              <li key={step.id} className="flex gap-3 group">
                {/* Step number + line */}
                <div className="flex flex-col items-center">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  {!isLast && (
                    <div className="mt-1 w-0.5 flex-1 bg-primary/20 min-h-[20px]" aria-hidden />
                  )}
                </div>

                {/* Content */}
                <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-4")}>
                  <p className="text-sm font-semibold text-ink mb-0.5">{step.label}</p>
                  <p className="text-sm text-muted text-pretty mb-2">{step.description}</p>

                  {/* Chips row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {step.tool && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eef0f5] px-2 py-0.5 text-[11px] font-mono text-muted">
                        <Terminal className="size-3 shrink-0" aria-hidden />
                        {step.tool}
                      </span>
                    )}
                    {complianceCheck && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-medium text-success-ink">
                        <CircleCheck className="size-3 shrink-0" aria-hidden />
                        {complianceCheck.short}
                        <span className="font-mono text-[10px] opacity-70 ml-0.5">{complianceCheck.cite}</span>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <Divider />

      {/* Agent tools */}
      <section>
        <SectionLabel className="mb-3">Agent tools</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AGENT_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-3"
            >
              <span
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#eef0f5] text-subtle"
                aria-hidden
              >
                <Wrench className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-mono font-medium text-ink truncate">{tool.name}</p>
                <p className="text-xs text-muted mt-0.5 text-pretty">{tool.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
