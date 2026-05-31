"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Gauge, TrendLine } from "@/components/ui/charts";
import { Button } from "@/components/ui/Button";
import { TONE_HEX } from "@/components/ui/tones";
import { CEKURA_RUN } from "@/lib/data";
import { pct } from "@/lib/format";

export function ComplianceHero() {
  const iterationScores = CEKURA_RUN.iterations.map((it) => it.complianceScore);
  const iterationLabels = CEKURA_RUN.iterations.map((it) => `I${it.n}`);
  const numIterations = CEKURA_RUN.iterations.length - 1; // exclude baseline

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader
          title="FDCPA Compliance Score"
          subtitle="Cekura adversarial evaluation — auto-hardened by Claude"
          icon={<ShieldCheck className="size-4" />}
          action={
            <Link href="/evaluations" tabIndex={-1}>
              <Button variant="subtle" size="sm" rightIcon={<ShieldCheck className="size-3.5" />}>
                Compliance Lab
              </Button>
            </Link>
          }
        />

        <div className="px-5 pb-5 flex flex-col gap-5 flex-1">
          {/* Gauge + headline stats */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0">
              <Gauge
                value={CEKURA_RUN.finalScore}
                size={136}
                stroke={13}
                color={TONE_HEX.success}
                label={
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold tnum text-ink leading-none">
                      {pct(CEKURA_RUN.finalScore)}
                    </span>
                    <span className="text-[11px] font-medium text-subtle mt-1 uppercase tracking-wide">
                      Pass rate
                    </span>
                  </div>
                }
              />
            </div>

            <div className="flex flex-col gap-3 min-w-0 flex-1">
              {/* Hero copy */}
              <p className="text-sm text-ink font-semibold leading-snug">
                100% FDCPA-compliant across Cekura's 8 adversarial personas
              </p>
              <p className="text-sm text-muted text-pretty leading-relaxed">
                Auto-hardened from{" "}
                <span className="font-semibold text-danger-ink tnum">{pct(CEKURA_RUN.baselineScore)}</span>{" "}
                baseline to{" "}
                <span className="font-semibold text-success-ink tnum">{pct(CEKURA_RUN.finalScore)}</span>{" "}
                by Claude in{" "}
                <span className="font-semibold text-ink">{numIterations} iterations</span>.
                PTP rate improved from{" "}
                <span className="font-semibold text-ink tnum">{pct(CEKURA_RUN.baselinePtp)}</span> to{" "}
                <span className="font-semibold text-success-ink tnum">{pct(CEKURA_RUN.finalPtp)}</span>.
              </p>

              {/* Pill stats row */}
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success-ink">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden />
                  {CEKURA_RUN.personas.length} personas tested
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  {numIterations} improvement loops
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0f5] px-2.5 py-1 text-xs font-medium text-[#4a5168]">
                  {CEKURA_RUN.model}
                </span>
              </div>
            </div>
          </div>

          {/* Trend line */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle mb-2">
              Compliance score across iterations
            </p>
            <TrendLine
              data={iterationScores}
              labels={iterationLabels}
              color={TONE_HEX.success}
              height={110}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
