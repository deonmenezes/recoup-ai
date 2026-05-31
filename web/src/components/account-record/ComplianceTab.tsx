"use client";

import Link from "next/link";
import { CircleCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { SectionLabel } from "@/components/ui/primitives";
import { COMPLIANCE_CHECKS, CEKURA_RUN } from "@/lib/data";

export function ComplianceTab() {
  return (
    <div className="px-5 py-5 space-y-6">
      {/* Header blurb */}
      <div className="flex items-start gap-3 rounded-xl bg-success-soft border border-success/20 px-4 py-3.5">
        <ShieldCheck className="size-5 text-success-ink shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-success-ink">
            100% FDCPA compliance enforced on every call
          </p>
          <p className="text-xs text-success-ink/80 mt-0.5 text-pretty">
            Riley checks all 6 rules automatically. Agents cannot proceed past a step until the
            compliance gate is cleared.
          </p>
        </div>
      </div>

      {/* Checks */}
      <section>
        <SectionLabel className="mb-3">Compliance rules</SectionLabel>
        <ul className="space-y-2">
          {COMPLIANCE_CHECKS.map((check) => (
            <li
              key={check.key}
              className="flex items-start gap-3 rounded-xl border border-success/20 bg-success-soft/30 p-4"
            >
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-ink"
                aria-hidden
              >
                <CircleCheck className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-ink">{check.label}</p>
                  <span className="text-[11px] font-mono text-success-ink bg-success-soft px-2 py-0.5 rounded-full">
                    {check.cite}
                  </span>
                </div>
                <p className="text-xs text-muted">{check.short}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Cekura link */}
      <div className="rounded-xl bg-primary-softer border border-primary/15 p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">
            Verified continuously by Cekura
          </p>
          <p className="text-xs text-primary/80 mt-0.5 text-pretty">
            {CEKURA_RUN.finalScore}% compliance score across {CEKURA_RUN.personas.length} adversarial
            personas — improved from {CEKURA_RUN.baselineScore}% baseline.
          </p>
        </div>
        <Link
          href="/evaluations"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary text-white text-xs font-medium px-3 py-2 hover:bg-primary-hover transition-colors"
        >
          View evaluations
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
