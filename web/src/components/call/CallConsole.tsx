"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, CircleX, PhoneOff } from "lucide-react";
import { useAccount } from "@/lib/store";
import { recordCall, recordPromise } from "@/lib/store";
import { toast } from "@/lib/toast";
import { scenarioFor, TYPE_SPEED_MS } from "@/lib/callEngine";
import { COMPLIANCE_CHECKS } from "@/lib/data";
import { money, clock } from "@/lib/format";
import type { ComplianceKey } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CallStage } from "./CallStage";
import { TranscriptStream } from "./TranscriptStream";
import type { RevealedTurn } from "./TranscriptStream";
import { ComplianceChecklist } from "./ComplianceChecklist";

type Phase = "dialing" | "ringing" | "connected" | "wrapup" | "ended";

const OUTCOME_LABEL: Record<string, string> = {
  promise_to_pay: "Promise to Pay",
  dispute: "Dispute Logged",
  cease: "Cease Honored",
  no_answer: "No Answer",
  refused: "No Commitment",
  in_progress: "In Progress",
};

const OUTCOME_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  promise_to_pay: "success",
  dispute: "warning",
  cease: "neutral",
  no_answer: "neutral",
  refused: "danger",
  in_progress: "info",
};

export function CallConsole({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const debtor = useAccount(accountId);
  const scenario = useMemo(() => (debtor ? scenarioFor(debtor) : null), [debtor]);

  // ── Phase machine ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("dialing");
  // elapsedMs since connect
  const [elapsedMs, setElapsedMs] = useState(0);
  const connectTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Transcript playback ───────────────────────────────────────────────────
  const [revealedTurns, setRevealedTurns] = useState<RevealedTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  // ── Script + Compliance state ─────────────────────────────────────────────
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [satisfiedKeys, setSatisfiedKeys] = useState<Set<ComplianceKey>>(new Set());
  // Keep the ref in sync whenever state updates
  useEffect(() => { satisfiedKeysRef.current = satisfiedKeys; }, [satisfiedKeys]);

  // ── Guards to fire actions only once ─────────────────────────────────────
  const promiseGuard = useRef(false);
  const recordGuard = useRef(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  // Mirror satisfiedKeys in a ref so hangUp always has the latest value
  const satisfiedKeysRef = useRef<Set<ComplianceKey>>(new Set());

  // ── Right-panel tab state ─────────────────────────────────────────────────
  const [rightTab, setRightTab] = useState<"transcript" | "compliance">("transcript");

  // ── Outcome summary (shown at ended) ─────────────────────────────────────
  const [showOutcome, setShowOutcome] = useState(false);
  // The outcome actually reached — "in_progress" when ended early, else the
  // scenario's scripted outcome. Drives the summary label + tone (not the
  // celebratory scenario default).
  const [endedOutcome, setEndedOutcome] = useState<string | null>(null);

  // All timeouts we schedule so we can clean up
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  function scheduleTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }
  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  // ── Stream a single turn's text character by character ───────────────────
  function streamTurnText(
    turnId: string,
    fullText: string,
    onComplete: () => void,
  ) {
    let revealed = "";
    let charIdx = 0;
    function reveal() {
      charIdx++;
      revealed = fullText.slice(0, charIdx);
      setRevealedTurns((prev) =>
        prev.map((rt) =>
          rt.turn.id === turnId ? { ...rt, visibleText: revealed } : rt,
        ),
      );
      if (charIdx < fullText.length) {
        scheduleTimeout(reveal, TYPE_SPEED_MS);
      } else {
        onComplete();
      }
    }
    scheduleTimeout(reveal, TYPE_SPEED_MS);
  }

  // ── Connect callback ──────────────────────────────────────────────────────
  const connectCall = useCallback(() => {
    connectTimeRef.current = Date.now();
    setPhase("connected");

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      if (connectTimeRef.current) {
        setElapsedMs(Date.now() - connectTimeRef.current);
      }
    }, 250);

    // Fire-and-forget POST /api/calls (optional real Twilio/Pipecat trigger)
    fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    }).catch(() => {
      // Ignore — demo always works via scripted playback
    });
  }, [accountId]);

  // ── Hang-up handler ───────────────────────────────────────────────────────
  const hangUp = useCallback(
    (fromButton = false) => {
      clearAllTimeouts();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTyping(false);
      setAgentSpeaking(false);

      if (!scenario) {
        onClose();
        return;
      }

      const elapsed = connectTimeRef.current ? Date.now() - connectTimeRef.current : 0;
      const fired = Array.from(satisfiedKeysRef.current);
      // Ending via the End-call button / X before the scripted close means the
      // call did not reach its outcome — record + display "in_progress".
      const outcome = fromButton ? "in_progress" : scenario.outcome;
      setEndedOutcome(outcome);

      if (!recordGuard.current) {
        recordGuard.current = true;
        recordCall(accountId, {
          outcome,
          durationMs: elapsed,
          compliance: fired,
          summary: fromButton
            ? `Call ended early after ${clock(elapsed)}.`
            : `${OUTCOME_LABEL[scenario.outcome]} — ${fired.length}/${COMPLIANCE_CHECKS.length} compliance checks passed.`,
        });
        const recap = fromButton
          ? `Call ended after ${clock(elapsed)}`
          : `${OUTCOME_LABEL[scenario.outcome]} · ${clock(elapsed)}`;
        toast.success("Call complete", recap);
      }

      setPhase("ended");
      setShowOutcome(true);
    },
    [scenario, accountId, onClose],
  );

  // ── Phase machine + turn scheduling ──────────────────────────────────────
  useEffect(() => {
    if (!scenario) return;

    // dialing → ringing
    scheduleTimeout(() => setPhase("ringing"), 900);
    // ringing → connected
    scheduleTimeout(() => {
      connectCall();
    }, 900 + 1500);

    // Schedule transcript turns relative to connect time (phase offset = 900+1500)
    const phaseOffset = 900 + 1500;
    let prevStepId: string | null = null;

    for (const turn of scenario.turns) {
      const delay = phaseOffset + turn.at;

      scheduleTimeout(() => {
        if (turn.role === "agent") {
          // Show typing indicator first
          setTyping(true);
          setAgentSpeaking(true);
        }

        // Append turn with empty text (will be streamed)
        setRevealedTurns((prev) => [...prev, { turn, visibleText: "" }]);

        // For agent turns: character-stream; for others: reveal immediately
        if (turn.role === "agent") {
          setTyping(false);
          streamTurnText(turn.id, turn.text, () => {
            setAgentSpeaking(false);

            // Fire compliance keys
            if (turn.fires?.length) {
              setSatisfiedKeys((prev) => {
                const next = new Set(prev);
                turn.fires!.forEach((k) => next.add(k));
                return next;
              });
            }

            // Advance script step
            if (turn.step) {
              // Mark previous step complete if it existed and is different
              if (prevStepId && prevStepId !== turn.step) {
                setCompletedStepIds((prev) => {
                  const next = new Set(prev);
                  next.add(prevStepId!);
                  return next;
                });
              }
              setActiveStepId(turn.step);
              prevStepId = turn.step;
            }

            // Promise capture
            if (
              turn.tool === "log_promise_to_pay" &&
              scenario.result?.promise &&
              !promiseGuard.current
            ) {
              promiseGuard.current = true;
              const conf = recordPromise(accountId, scenario.result.promise);
              setConfirmation(conf);
            }

            // End-of-call tool
            if (turn.tool === "end_call") {
              // Mark final step complete
              if (turn.step) {
                setCompletedStepIds((prev) => {
                  const next = new Set(prev);
                  next.add(turn.step!);
                  return next;
                });
              }
              setActiveStepId(null);
              setPhase("wrapup");
            }
          });
        } else {
          // Debtor / system — show immediately
          setRevealedTurns((prev) =>
            prev.map((rt) =>
              rt.turn.id === turn.id ? { ...rt, visibleText: turn.text } : rt,
            ),
          );

          // Fire compliance + step for non-agent turns too
          if (turn.fires?.length) {
            setSatisfiedKeys((prev) => {
              const next = new Set(prev);
              turn.fires!.forEach((k) => next.add(k));
              return next;
            });
          }
        }
      }, delay);
    }

    // Auto end-call after the last turn + buffer
    const lastTurn = scenario.turns[scenario.turns.length - 1];
    const endDelay = phaseOffset + lastTurn.at + 2000;
    scheduleTimeout(() => {
      if (!recordGuard.current) {
        hangUp(false);
      }
    }, endDelay);

    return () => {
      clearAllTimeouts();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // ── Outcome tone ──────────────────────────────────────────────────────────
  // Reflects what actually happened (in_progress on an early hang-up), so the
  // summary never shows a false "Promise to Pay" success on an aborted call.
  const finalOutcome = endedOutcome ?? scenario?.outcome ?? "in_progress";
  const outcomeTone = OUTCOME_TONE[finalOutcome] ?? "neutral";

  if (!debtor || !scenario) return null;

  // ── Right panel content ───────────────────────────────────────────────────
  const rightPanel = (
    <div className="flex flex-col h-full min-h-0">
      <Tabs
        items={[
          { id: "transcript", label: "Transcript", count: revealedTurns.filter((r) => r.turn.role !== "system").length },
          { id: "compliance", label: "Compliance", count: satisfiedKeys.size },
        ]}
        active={rightTab}
        onChange={(id) => setRightTab(id as "transcript" | "compliance")}
        className="px-2 shrink-0"
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        {rightTab === "transcript" ? (
          <TranscriptStream turns={revealedTurns} typing={typing} />
        ) : (
          <ComplianceChecklist satisfied={satisfiedKeys} />
        )}
      </div>
    </div>
  );

  // ── Outcome panel (shown after ended) ────────────────────────────────────
  if (showOutcome) {
    return (
      <motion.div
        key="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/60 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Call outcome summary"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-2xl bg-surface shadow-xl overflow-hidden"
        >
          {/* Header band */}
          <div
            className={cn(
              "flex flex-col items-center gap-2 px-8 py-8",
              outcomeTone === "success"
                ? "bg-success-soft"
                : outcomeTone === "warning"
                  ? "bg-warning-soft"
                  : outcomeTone === "danger"
                    ? "bg-danger-soft"
                    : "bg-primary-soft",
            )}
          >
            {outcomeTone === "success" ? (
              <CheckCircle2 className="size-10 text-success-ink" aria-hidden />
            ) : outcomeTone === "danger" || outcomeTone === "warning" ? (
              <CircleX className="size-10 text-danger-ink" aria-hidden />
            ) : (
              <PhoneOff className="size-10 text-muted" aria-hidden />
            )}
            <h3 className="text-lg font-bold text-ink">
              {OUTCOME_LABEL[finalOutcome]}
            </h3>
            <p className="tnum text-sm text-muted">
              Duration: {clock(elapsedMs || (connectTimeRef.current ? Date.now() - connectTimeRef.current : 0))}
            </p>
          </div>

          {/* Detail rows */}
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Promise captured */}
            {confirmation && scenario.result?.promise && (
              <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-success-ink mb-1">
                  Promise captured
                </p>
                <p className="text-sm text-ink">
                  <span className="tnum font-semibold">{money(scenario.result.promise.amount)}</span>
                  {" on "}
                  {scenario.result.promise.date}
                  {scenario.result.promise.planId === "plan_6mo" ? " · 6-month plan" : ""}
                </p>
                <p className="mt-1 text-[11px] tnum text-muted">Confirmation: {confirmation}</p>
              </div>
            )}

            {/* Compliance summary */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2">
                FDCPA compliance
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPLIANCE_CHECKS.map((check) => {
                  const done = satisfiedKeys.has(check.key);
                  return (
                    <span
                      key={check.key}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                        done ? "bg-success-soft text-success-ink" : "bg-[#eef0f5] text-muted",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="size-3" aria-hidden />
                      ) : (
                        <span className="size-3 rounded-full border border-faint" aria-hidden />
                      )}
                      {check.short}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Pre-connect overlay (dialing / ringing) ───────────────────────────────
  if (phase === "dialing" || phase === "ringing") {
    return (
      <motion.div
        key="pre-connect"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/60 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-label={phase === "dialing" ? "Dialing" : "Ringing"}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
          style={{ background: "linear-gradient(160deg, #161331 0%, #1f1a45 55%, #2d2566 100%)" }}
        >
          <div className="flex flex-col items-center gap-4 px-8 py-10">
            {/* DEMO badge */}
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
              DEMO
            </span>

            {/* Avatar */}
            <div className={cn("mt-2", phase === "ringing" && "animate-ring-pulse rounded-full")}>
              <span
                className="inline-flex size-20 items-center justify-center rounded-full font-semibold text-2xl text-white shadow-xl ring-2 ring-white/20"
                style={{ background: "linear-gradient(135deg, #6366f1, #4338ca)" }}
                aria-hidden
              >
                {debtor.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
            </div>

            <div className="text-center">
              <p className="text-base font-bold text-white">{debtor.name}</p>
              <p className="text-xs text-white/60 tnum mt-0.5">{debtor.phone}</p>
            </div>

            <p className="text-sm font-medium text-white/70">
              {phase === "dialing" ? "Dialing…" : "Ringing…"}
            </p>

            {/* Animated dots */}
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block size-2 rounded-full bg-white/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden
                />
              ))}
            </div>

            <button
              onClick={() => hangUp(true)}
              className="mt-2 flex size-14 items-center justify-center rounded-full bg-danger text-white shadow-lg hover:bg-danger-ink active:scale-95 transition-transform cursor-pointer"
              aria-label="End call"
              title="End call"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Connected console (two columns on lg) ─────────────────────────────────
  return (
    <motion.div
      key="console"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Call with ${debtor.name}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl bg-surface shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top chrome bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success-ink uppercase tracking-wide">
              <span className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden />
              LIVE
            </span>
            <span className="text-sm font-semibold text-ink hidden sm:block">
              Riley · AI Collections Agent
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="tnum text-sm font-medium text-muted hidden sm:block tabular-nums">
              {clock(elapsedMs)}
            </span>
            <IconButton
              label="Close call console"
              size="sm"
              variant="ghost"
              onClick={() => hangUp(true)}
              className="text-muted hover:text-ink"
            >
              <X className="size-4" />
            </IconButton>
          </div>
        </div>

        {/* Main content — two-column on lg */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* LEFT — CallStage */}
          <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
            <CallStage
              debtor={debtor}
              phase={phase}
              elapsedMs={elapsedMs}
              agentSpeaking={agentSpeaking}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onEndCall={() => hangUp(true)}
              activeStepId={activeStepId}
              completedStepIds={completedStepIds}
            />
          </div>

          {/* RIGHT — Transcript + Compliance */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Promise banner */}
            {confirmation && scenario.result?.promise && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-4 mt-3 shrink-0 rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 flex items-center gap-2"
              >
                <CheckCircle2 className="size-4 text-success shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-success-ink">
                    Promise captured ·{" "}
                  </span>
                  <span className="tnum text-xs text-success-ink font-medium">{confirmation}</span>
                  <span className="text-xs text-success-ink">
                    {" "}· {money(scenario.result.promise.amount)} on {scenario.result.promise.date}
                  </span>
                </div>
              </motion.div>
            )}

            {rightPanel}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
