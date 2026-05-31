"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { dismissToast, useToasts, type ToastTone } from "@/lib/toast";
import { cn } from "@/lib/cn";

const ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" />,
  warning: <AlertTriangle className="size-5 text-warning" />,
  danger: <XCircle className="size-5 text-danger" />,
  info: <Info className="size-5 text-info" />,
  default: <Info className="size-5 text-primary" />,
};

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-5 right-5 z-[1000] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2.5"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-lg"
          >
            <span className="mt-0.5 shrink-0">{ICON[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-muted text-pretty">{t.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className={cn(
                "shrink-0 rounded-md p-1 text-subtle transition-colors hover:bg-[#eef0f5] hover:text-ink cursor-pointer",
              )}
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
