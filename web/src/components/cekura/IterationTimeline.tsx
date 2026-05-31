"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle, Wrench, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/primitives";
import { TONE_HEX } from "@/components/ui/tones";
import type { CekuraIteration } from "@/lib/types";
import { pct } from "@/lib/format";
import { cn } from "@/lib/cn";

function scoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 95) return "success";
  if (score >= 70) return "warning";
  return "danger";
}

interface Props {
  iterations: CekuraIteration[];
  progress: number;
}

export function IterationTimeline({ iterations, progress }: Props) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle mb-3">
        Iteration Timeline
      </p>
      <div className="relative">
        {/* Vertical connector rail */}
        <div
          className="absolute left-[19px] top-6 bottom-6 w-px bg-border"
          aria-hidden
        />
        <div className="space-y-3">
          {iterations.map((iter, idx) => {
            const isActive = idx === progress;
            const isFuture = idx > progress;
            const tone = scoreTone(iter.complianceScore);

            return (
              <AnimatePresence key={iter.n} initial={false}>
                <motion.div
                  initial={idx === progress && progress > 0 ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: isFuture ? 0.4 : 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative pl-12"
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-0 top-4 flex size-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "border-primary bg-primary text-white shadow-md"
                        : isFuture
                          ? "border-border bg-surface text-subtle"
                          : "border-success bg-success-soft text-success-ink",
                    )}
                    aria-hidden
                  >
                    {isFuture ? (
                      <Lock className="size-4" />
                    ) : isActive ? (
                      <span className="text-xs font-bold">{iter.n}</span>
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                  </div>

                  <Card
                    className={cn(
                      "p-4 transition-all duration-300",
                      isActive && "ring-2 ring-primary/25 shadow-md",
                      isFuture && "opacity-50",
                    )}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wider",
                            isActive ? "text-primary" : "text-subtle",
                          )}
                        >
                          v{iter.n}
                        </span>
                        <h3 className="text-sm font-semibold text-ink">{iter.label}</h3>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-softer px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={tone}>
                          {pct(iter.complianceScore)} compliant
                        </Badge>
                        <Badge tone="success">
                          {pct(iter.ptpRate)} PTP
                        </Badge>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="mt-2 text-sm text-muted text-pretty">{iter.summary}</p>

                    {iter.diagnosis && iter.diagnosis !== "—" && (
                      <div className="mt-3 flex gap-2">
                        <Stethoscope className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                        <p className="text-xs text-muted">
                          <span className="font-medium text-subtle">Diagnosis: </span>
                          {iter.diagnosis}
                        </p>
                      </div>
                    )}

                    {iter.fix && iter.fix !== "—" && (
                      <div className="mt-2 rounded-lg bg-primary-softer px-3 py-2 flex gap-2">
                        <Wrench className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                        <p className="text-xs text-primary">
                          <span className="font-semibold">Claude&rsquo;s fix: </span>
                          {iter.fix}
                        </p>
                      </div>
                    )}

                    {iter.failuresFixed.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {iter.failuresFixed.map((fix) => (
                          <span
                            key={fix}
                            className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-ink"
                          >
                            <CheckCircle className="size-3" aria-hidden />
                            {fix}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </div>
  );
}
