"use client";

import { CircleCheck, Circle } from "lucide-react";
import { COMPLIANCE_CHECKS } from "@/lib/data";
import type { ComplianceKey } from "@/lib/types";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

interface ComplianceChecklistProps {
  satisfied: Set<ComplianceKey>;
}

export function ComplianceChecklist({ satisfied }: ComplianceChecklistProps) {
  const count = satisfied.size;
  const total = COMPLIANCE_CHECKS.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            FDCPA compliance · live
          </p>
        </div>
        <span
          className={cn(
            "tnum text-xs font-semibold tabular-nums",
            count === total ? "text-success-ink" : count > 0 ? "text-warning-ink" : "text-subtle",
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {count}/{total}
        </span>
      </div>

      {/* Checks */}
      <div className="flex flex-col divide-y divide-border" role="list" aria-label="Compliance checklist">
        {COMPLIANCE_CHECKS.map((check, idx) => {
          const done = satisfied.has(check.key);
          return (
            <motion.div
              key={check.key}
              role="listitem"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="flex items-start gap-3 px-4 py-2.5"
            >
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="mt-0.5 shrink-0"
                    aria-label="Satisfied"
                  >
                    <CircleCheck className="size-4 text-success" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="pending"
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="mt-0.5 shrink-0"
                    aria-label="Pending"
                  >
                    <Circle className="size-4 text-faint" />
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    done ? "text-success-ink" : "text-muted",
                  )}
                >
                  {check.short}
                </p>
                <p className="mt-0.5 text-[10px] text-subtle tnum">{check.cite}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
