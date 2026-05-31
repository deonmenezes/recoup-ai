"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PAYMENT_OPTIONS } from "@/lib/data";
import { money } from "@/lib/format";

interface Props {
  open: boolean;
  defaultAmount: number;
  onClose: () => void;
  onSubmit: (amount: number, date: string, planId: string | null) => void;
}

export function PromiseDialog({ open, defaultAmount, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState(String(defaultAmount.toFixed(2)));
  const [date, setDate] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount.toFixed(2)));
      setDate("");
      setPlanId(null);
      setSubmitting(false);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, defaultAmount]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const eligiblePlans = PAYMENT_OPTIONS.filter((p) => !p.managerApproved);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !date.trim()) return;
    setSubmitting(true);
    onSubmit(parsed, date.trim(), planId);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promise-dialog-title"
        >
          {/* Scrim */}
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md card shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success-ink">
                  <CircleCheck className="size-4" aria-hidden />
                </span>
                <h2 id="promise-dialog-title" className="text-sm font-semibold text-ink">
                  Log Promise to Pay
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-[#eef0f5] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Amount */}
              <div>
                <label htmlFor="ptp-amount" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                  Amount <span className="text-danger" aria-hidden>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-medium" aria-hidden>$</span>
                  <input
                    ref={firstRef}
                    id="ptp-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-border-strong bg-surface pl-7 pr-3 py-2.5 text-sm text-ink placeholder-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tnum"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="ptp-date" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                  Payment date <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="ptp-date"
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder='e.g. "this Friday" or "June 6th"'
                />
              </div>

              {/* Plan */}
              <div>
                <label htmlFor="ptp-plan" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                  Payment plan <span className="text-muted font-normal">(optional)</span>
                </label>
                <select
                  id="ptp-plan"
                  value={planId ?? ""}
                  onChange={(e) => setPlanId(e.target.value || null)}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">No plan selected</option>
                  {eligiblePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.label}
                    </option>
                  ))}
                </select>
                {planId && (
                  <p className="mt-1.5 text-xs text-subtle">
                    {eligiblePlans.find((p) => p.id === planId)?.description}
                  </p>
                )}
              </div>

              {/* Summary */}
              {parseFloat(amount) > 0 && date.trim() && (
                <div className="rounded-lg bg-success-soft border border-success/20 px-4 py-3">
                  <p className="text-xs text-success-ink">
                    <span className="font-semibold">{money(parseFloat(amount) || 0)}</span> will be logged as a promise
                    to pay on <span className="font-semibold">{date}</span>.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  type="submit"
                  variant="success"
                  size="md"
                  className="flex-1"
                  loading={submitting}
                  disabled={!amount || !date.trim() || parseFloat(amount) <= 0}
                >
                  Log promise
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
