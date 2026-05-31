"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { SCRIPT_STEPS } from "@/lib/data";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

interface ScriptTrackerProps {
  activeStepId: string | null;
  completedStepIds: Set<string>;
}

export function ScriptTracker({ activeStepId, completedStepIds }: ScriptTrackerProps) {
  return (
    <div className="flex flex-col gap-0.5" role="list" aria-label="Call script steps">
      {SCRIPT_STEPS.map((step, idx) => {
        const isDone = completedStepIds.has(step.id);
        const isActive = step.id === activeStepId && !isDone;

        return (
          <motion.div
            key={step.id}
            role="listitem"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.2 }}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-200",
              isActive && "bg-primary-soft",
              isDone && "opacity-60",
              !isActive && !isDone && "opacity-40",
            )}
          >
            <span className="shrink-0">
              {isDone ? (
                <CheckCircle2
                  className="size-4 text-success"
                  aria-label="Completed"
                />
              ) : (
                <Circle
                  className={cn(
                    "size-4 transition-colors duration-200",
                    isActive ? "text-primary" : "text-faint",
                  )}
                  aria-label={isActive ? "In progress" : "Pending"}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-medium truncate transition-colors duration-200",
                  isActive ? "text-primary" : isDone ? "text-muted" : "text-subtle",
                )}
              >
                {step.label}
              </p>
            </div>
            {step.tool && isActive && (
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {step.tool}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
