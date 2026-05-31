"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, FlaskConical, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/primitives";
import { CEKURA_RUN } from "@/lib/data";
import { useCekuraProgress, setCekuraProgress } from "@/lib/store";
import { ScoreHeadline } from "./ScoreHeadline";
import { IterationTimeline } from "./IterationTimeline";
import { PersonaGrid } from "./PersonaGrid";
import { MetricLegend } from "./MetricLegend";
import { LoopDiagram } from "./LoopDiagram";
import { cn } from "@/lib/cn";

const STEP_DURATION_MS = 900; // ms between iteration steps during animation

export function CekuraView() {
  const progress = useCekuraProgress();
  const maxProgress = CEKURA_RUN.iterations.length - 1;
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isRunning = useRef(false);

  const currentIteration = useMemo(
    () => CEKURA_RUN.iterations[progress] ?? CEKURA_RUN.iterations[0],
    [progress],
  );

  const clearTimers = useCallback(() => {
    for (const t of animTimers.current) clearTimeout(t);
    animTimers.current = [];
    isRunning.current = false;
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleRunEval = useCallback(() => {
    if (isRunning.current) return;
    isRunning.current = true;
    // Reset to baseline first, then step through
    setCekuraProgress(0);
    for (let i = 1; i <= maxProgress; i++) {
      const t = setTimeout(() => {
        setCekuraProgress(i);
        if (i === maxProgress) {
          isRunning.current = false;
        }
      }, i * STEP_DURATION_MS);
      animTimers.current.push(t);
    }
  }, [maxProgress]);

  const handleReset = useCallback(() => {
    clearTimers();
    setCekuraProgress(0);
  }, [clearTimers]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearTimers();
      setCekuraProgress(Number(e.target.value));
    },
    [clearTimers],
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary shadow-xs">
            <FlaskConical className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">
              Compliance Lab
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted text-pretty">
              Cekura runs adversarial debtor personas against Riley, grades every call, and Claude
              auto-hardens the prompt until 100% compliant.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="primary" dot>
                {CEKURA_RUN.agentName}
              </Badge>
              <Badge tone="neutral">
                <Cpu className="size-3" aria-hidden />
                {CEKURA_RUN.model}
              </Badge>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="size-4" aria-hidden />}
            onClick={handleReset}
          >
            Reset to baseline
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className="size-4" aria-hidden />}
            onClick={handleRunEval}
          >
            Run eval suite
          </Button>
        </div>
      </motion.div>

      {/* ── Scrubber ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="card px-5 py-4"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Iteration scrubber
          </p>
          <span className="text-xs font-semibold text-ink">
            Iteration {progress} / {maxProgress} &mdash;{" "}
            <span className="text-primary">{currentIteration.label}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Step buttons */}
          <div className="flex gap-1">
            {CEKURA_RUN.iterations.map((iter) => (
              <button
                key={iter.n}
                onClick={() => {
                  clearTimers();
                  setCekuraProgress(iter.n);
                }}
                aria-label={`Go to iteration ${iter.n}: ${iter.label}`}
                className={cn(
                  "flex h-8 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-xs font-semibold transition-all duration-150 cursor-pointer",
                  progress === iter.n
                    ? "bg-primary text-white shadow-sm"
                    : iter.n < progress
                      ? "bg-success-soft text-success-ink hover:bg-success-soft/70"
                      : "bg-[#eef0f5] text-subtle hover:bg-[#e6e8f0] hover:text-ink",
                )}
              >
                {iter.n === 0 ? "Base" : `v${iter.n}`}
              </button>
            ))}
          </div>
          {/* Range slider */}
          <input
            type="range"
            min={0}
            max={maxProgress}
            step={1}
            value={progress}
            onChange={handleScrub}
            aria-label="Iteration scrubber"
            className="flex-1 h-1.5 rounded-full accent-primary cursor-pointer"
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-subtle">
          {CEKURA_RUN.iterations.map((iter) => (
            <span key={iter.n} className="tnum">
              {iter.complianceScore}%
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Loop diagram ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <LoopDiagram />
      </motion.div>

      {/* ── Score headline band ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        <ScoreHeadline
          run={CEKURA_RUN}
          currentIteration={currentIteration}
          progress={progress}
        />
      </motion.div>

      <Divider />

      {/* ── Two-column: timeline + personas ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* Timeline (left column) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <IterationTimeline
            iterations={CEKURA_RUN.iterations}
            progress={progress}
          />
        </motion.div>

        {/* Persona grid (right column) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5"
        >
          <PersonaGrid
            personas={CEKURA_RUN.personas}
            progress={progress}
            maxProgress={maxProgress}
          />
          <MetricLegend metrics={CEKURA_RUN.metrics} />
        </motion.div>
      </div>
    </div>
  );
}
