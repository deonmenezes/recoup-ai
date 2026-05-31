"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Gauge, TrendLine } from "@/components/ui/charts";
import { Card } from "@/components/ui/primitives";
import { TONE_HEX } from "@/components/ui/tones";
import type { CekuraRun, CekuraIteration } from "@/lib/types";
import { pct } from "@/lib/format";
import { cn } from "@/lib/cn";

function scoreColor(score: number): string {
  if (score >= 95) return TONE_HEX.success;
  if (score >= 70) return TONE_HEX.warning;
  return TONE_HEX.danger;
}

function scoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 95) return "success";
  if (score >= 70) return "warning";
  return "danger";
}

interface Props {
  run: CekuraRun;
  currentIteration: CekuraIteration;
  progress: number;
}

export function ScoreHeadline({ run, currentIteration, progress }: Props) {
  const allScores = useMemo(
    () => run.iterations.slice(0, progress + 1).map((it) => it.complianceScore),
    [run.iterations, progress],
  );

  const allPtp = useMemo(
    () => run.iterations.slice(0, progress + 1).map((it) => it.ptpRate),
    [run.iterations, progress],
  );

  const allLabels = useMemo(
    () => run.iterations.slice(0, progress + 1).map((it) => `v${it.n}`),
    [run.iterations, progress],
  );

  const compDelta = currentIteration.complianceScore - run.baselineScore;
  const ptpDelta = currentIteration.ptpRate - run.baselinePtp;
  const tone = scoreTone(currentIteration.complianceScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Compliance gauge */}
      <Card className="p-5 flex flex-col items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle self-start">
          Compliance Score
        </p>
        <Gauge
          value={currentIteration.complianceScore}
          size={148}
          stroke={13}
          color={scoreColor(currentIteration.complianceScore)}
          label={
            <span
              className={cn(
                "text-3xl font-bold tnum",
                tone === "success"
                  ? "text-success-ink"
                  : tone === "warning"
                    ? "text-warning-ink"
                    : "text-danger-ink",
              )}
            >
              {currentIteration.complianceScore}%
            </span>
          }
          sublabel={`Iteration ${currentIteration.n} · ${currentIteration.label}`}
        />
        <div className="flex items-center gap-1.5">
          {compDelta >= 0 ? (
            <TrendingUp className="size-4 text-success-ink" aria-hidden />
          ) : (
            <TrendingDown className="size-4 text-danger-ink" aria-hidden />
          )}
          <span
            className={cn(
              "text-sm font-semibold tnum",
              compDelta >= 0 ? "text-success-ink" : "text-danger-ink",
            )}
          >
            {compDelta >= 0 ? "+" : ""}
            {compDelta}%
          </span>
          <span className="text-xs text-subtle">vs baseline</span>
        </div>
        <p className="text-[11px] text-center text-muted text-pretty">
          {run.baselineScore}% → {run.finalScore}% compliance &middot;{" "}
          {run.iterations.length - 1} auto-iterations &middot; 0 human edits
        </p>
      </Card>

      {/* Compliance trend line */}
      <Card className="p-5 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Score Over Iterations
        </p>
        <div className="flex-1 min-h-0 flex flex-col justify-center">
          <TrendLine
            data={allScores.length >= 2 ? allScores : [allScores[0] ?? 0, allScores[0] ?? 0]}
            labels={allLabels.length >= 2 ? allLabels : undefined}
            height={144}
            color={TONE_HEX.success}
          />
        </div>
        <div className="flex justify-between text-xs text-subtle">
          <span className="tnum">Baseline: {run.baselineScore}%</span>
          <span className="tnum font-semibold text-success-ink">Final: {run.finalScore}%</span>
        </div>
      </Card>

      {/* PTP rate card */}
      <Card className="p-5 flex flex-col gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Promise-to-Pay Rate
        </p>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-5xl font-bold tnum text-ink leading-none">
            {currentIteration.ptpRate}%
          </span>
          <div className="flex flex-col gap-0.5 pb-1">
            <div className="flex items-center gap-1">
              {ptpDelta >= 0 ? (
                <TrendingUp className="size-3.5 text-success-ink" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5 text-danger-ink" aria-hidden />
              )}
              <span
                className={cn(
                  "text-sm font-semibold tnum",
                  ptpDelta >= 0 ? "text-success-ink" : "text-danger-ink",
                )}
              >
                {ptpDelta >= 0 ? "+" : ""}
                {ptpDelta}%
              </span>
            </div>
            <span className="text-[11px] text-subtle">vs baseline</span>
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="flex-1 flex items-center">
          <div className="w-full">
            <div className="relative h-1.5 rounded-full bg-[#eceef6] overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all duration-700"
                style={{ width: `${currentIteration.ptpRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-subtle">Baseline PTP</span>
            <span className="tnum font-medium text-muted">{pct(run.baselinePtp)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-subtle">Final PTP</span>
            <span className="tnum font-semibold text-success-ink">{pct(run.finalPtp)}</span>
          </div>
        </div>

        <div className="text-[11px] text-muted">
          Improved by <span className="font-semibold text-success-ink">{run.finalPtp - run.baselinePtp}pp</span> after{" "}
          {run.iterations.length - 1} Claude iterations
        </div>
      </Card>
    </div>
  );
}
