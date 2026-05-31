"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, PhoneCall, X, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

type Status = "idle" | "calling" | "ringing" | "error";

/**
 * "Call me — talk to Riley live" — rings the visitor's own phone via Twilio and
 * connects it to the live Pipecat Cloud agent. Self-contained: renders a trigger
 * button + the dialog. Drop it anywhere.
 */
export function CallMeButton({
  variant = "primary",
  size = "md",
  label = "Call me — talk to Riley",
  className,
}: {
  variant?: "primary" | "secondary" | "subtle";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        leftIcon={<PhoneCall className="size-4" />}
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </Button>
      <CallMeDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CallMeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [maskedTo, setMaskedTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError(null);
      setMaskedTo(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "calling") return;
    setStatus("calling");
    setError(null);
    try {
      const res = await fetch("/api/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        mode?: string;
        callSid?: string;
        to?: string;
        error?: string;
        reason?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.mode === "live") {
        setStatus("ringing");
        setMaskedTo(data.to ?? null);
        toast.success("Calling your phone now", "Pick up to talk to Riley.");
      } else {
        setStatus("error");
        setError(data.reason ?? "Live calling isn't available on this deployment right now.");
      }
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="callme-title"
        >
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header band */}
            <div
              className="relative px-6 py-6 text-white"
              style={{ background: "linear-gradient(135deg, #161331, #2d2566 90%)" }}
            >
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-nav-accent">
                <span className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden />
                Live · NVIDIA Nemotron
              </span>
              <h2 id="callme-title" className="mt-3 flex items-center gap-2 text-lg font-bold">
                <PhoneCall className="size-5 text-nav-accent" aria-hidden />
                Talk to Riley, live
              </h2>
              <p className="mt-1 text-sm text-white/70 text-pretty">
                Enter your number and our compliant AI collections agent will call you in seconds.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === "ringing" ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-success-soft">
                    <CheckCircle2 className="size-7 text-success" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Calling {maskedTo} now</p>
                    <p className="mt-1 text-sm text-muted text-pretty">
                      Pick up and say hello — Riley will verify you, give the required disclosure, and
                      negotiate a plan. Hang up any time.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={onClose} className="mt-1">
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label htmlFor="callme-phone" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                    Your phone number <span className="text-danger" aria-hidden>*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                    <input
                      ref={inputRef}
                      id="callme-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(628) 555-0142"
                      className={cn(
                        "h-11 w-full rounded-lg border bg-surface-2 pl-9 pr-3 text-sm text-ink tnum",
                        "placeholder:text-subtle focus:bg-surface focus:outline-none",
                        error ? "border-danger focus:border-danger" : "border-border-strong focus:border-primary",
                      )}
                      aria-invalid={Boolean(error)}
                      aria-describedby="callme-help"
                    />
                  </div>
                  {error ? (
                    <p className="mt-1.5 text-[13px] text-danger-ink" role="alert">{error}</p>
                  ) : (
                    <p id="callme-help" className="mt-1.5 text-[12px] text-subtle">
                      US &amp; Canada (+1). Standard carrier rates may apply.
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="mt-4 w-full"
                    loading={status === "calling"}
                    leftIcon={status === "calling" ? undefined : <PhoneCall className="size-4" />}
                  >
                    {status === "calling" ? "Connecting…" : "Call my phone"}
                  </Button>

                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-success-soft px-3 py-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    <p className="text-[12px] text-success-ink text-pretty">
                      Demo call from a real FDCPA-compliant agent. It verifies the right party, gives the
                      mini-Miranda, and honors a dispute or "stop calling" instantly.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
