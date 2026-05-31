"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  title: string;
  description: string;
  /** If provided, shows a textarea for the user to enter a reason. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel = "Confirm",
  variant = "danger",
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const firstRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
      setTimeout(() => {
        if (reasonLabel) {
          reasonRef.current?.focus();
        } else {
          // No reason field → focus the SAFE action, never the destructive
          // confirm, so a stray Enter can't fire an irreversible action.
          cancelRef.current?.focus();
        }
      }, 50);
    }
  }, [open, reasonLabel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (reasonLabel && !reason.trim()) return;
    setSubmitting(true);
    onConfirm(reasonLabel ? reason.trim() : undefined);
  };

  const btnVariant = variant === "danger" ? "danger" : "primary";
  const iconBg = variant === "danger" ? "bg-danger-soft text-danger-ink" : "bg-warning-soft text-warning-ink";

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="relative z-10 w-full max-w-sm card shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                  <TriangleAlert className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 id="confirm-dialog-title" className="text-sm font-semibold text-ink leading-tight">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-muted text-pretty">{description}</p>
                </div>
              </div>

              {reasonLabel && (
                <div className="mt-4">
                  <label htmlFor="confirm-reason" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                    {reasonLabel} <span className="text-danger" aria-hidden>*</span>
                  </label>
                  <textarea
                    ref={reasonRef}
                    id="confirm-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full resize-y rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={reasonPlaceholder}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 px-5 pb-5">
              <Button
                ref={firstRef}
                variant={btnVariant}
                size="md"
                className="flex-1"
                loading={submitting}
                disabled={reasonLabel ? !reason.trim() : false}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
              <Button ref={cancelRef} variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
