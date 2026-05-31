"use client";

import { ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { CekuraMetric } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  metrics: CekuraMetric[];
}

export function MetricLegend({ metrics }: Props) {
  const compliance = metrics.filter((m) => m.kind === "compliance");
  const effectiveness = metrics.filter((m) => m.kind === "effectiveness");

  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle mb-4">
        Metric Legend
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold text-ink uppercase tracking-wide">Compliance</p>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
              {compliance.length}
            </span>
          </div>
          <ul className="space-y-2">
            {compliance.map((m) => (
              <li key={m.key} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-ink">{m.label}</p>
                  <p className="text-[11px] text-subtle">{m.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Effectiveness */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="size-4 text-success-ink" aria-hidden />
            <p className="text-xs font-semibold text-ink uppercase tracking-wide">Effectiveness</p>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success-ink">
              {effectiveness.length}
            </span>
          </div>
          <ul className="space-y-2">
            {effectiveness.map((m) => (
              <li key={m.key} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-success shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-ink">{m.label}</p>
                  <p className="text-[11px] text-subtle">{m.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
