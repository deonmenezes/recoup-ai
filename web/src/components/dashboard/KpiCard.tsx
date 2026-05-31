"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/ui/charts";
import { TONE_HEX } from "@/components/ui/tones";
import type { Tone } from "@/lib/data";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: Tone;
  sparkData?: number[];
  delta?: string;
  deltaUp?: boolean;
  index?: number;
}

export function KpiCard({
  label,
  value,
  icon,
  tone = "primary",
  sparkData,
  delta,
  deltaUp,
  index = 0,
}: KpiCardProps) {
  const hexColor = TONE_HEX[tone];

  return (
    <motion.div
      className="card flex flex-col gap-3 p-5 hover:shadow-md transition-shadow duration-200"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</span>
          <span className="text-2xl font-bold tracking-tight text-ink tnum leading-none">{value}</span>
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${hexColor}18`, color: hexColor }}
          aria-hidden
        >
          {icon}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 min-h-[36px]">
        {sparkData && sparkData.length >= 2 ? (
          <Sparkline
            data={sparkData}
            width={80}
            height={32}
            color={hexColor}
            fill
            className="shrink-0"
          />
        ) : (
          <div />
        )}
        {delta && (
          <span
            className={cn(
              "text-xs font-semibold tnum",
              deltaUp === true ? "text-success-ink" : deltaUp === false ? "text-danger-ink" : "text-subtle",
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </motion.div>
  );
}
