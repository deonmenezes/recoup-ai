"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CircleCheck, XCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import type { CekuraPersona, PersonaResult } from "@/lib/types";
import { cn } from "@/lib/cn";

// Mapping: which iterations flip which persona pairs to "improved"
// progress 0 → all baseline
// progress >= 1 → flip p2, p7
// progress >= 2 → flip p3, p5, p4, p6
// progress >= 3 → flip p1, p8
const IMPROVED_AT: Record<string, number> = {
  p2: 1,
  p7: 1,
  p3: 2,
  p5: 2,
  p4: 2,
  p6: 2,
  p1: 3,
  p8: 3,
};

function difficultyTone(d: "easy" | "medium" | "hard"): "success" | "warning" | "danger" {
  return d === "easy" ? "success" : d === "medium" ? "warning" : "danger";
}

function personaResults(
  persona: CekuraPersona,
  progress: number,
): PersonaResult[] {
  const threshold = IMPROVED_AT[persona.id] ?? 0;
  return progress >= threshold ? persona.improved : persona.baseline;
}

interface PersonaCardProps {
  persona: CekuraPersona;
  progress: number;
  index: number;
}

function PersonaCard({ persona, progress, index }: PersonaCardProps) {
  const results = useMemo(() => personaResults(persona, progress), [persona, progress]);
  const passing = results.filter((r) => r.pass).length;
  const total = results.length;
  const allPass = passing === total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="p-4 flex flex-col gap-3 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <User className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{persona.name}</p>
              <p className="text-[11px] text-subtle truncate">{persona.tests}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge tone={difficultyTone(persona.difficulty)}>
              {persona.difficulty}
            </Badge>
            <span
              className={cn(
                "text-[11px] font-semibold tnum",
                allPass ? "text-success-ink" : "text-warning-ink",
              )}
            >
              {passing}/{total} pass
            </span>
          </div>
        </div>

        {/* Scenario */}
        <p className="text-xs text-muted text-pretty leading-relaxed">{persona.scenario}</p>

        {/* Metric results */}
        <ul className="space-y-1.5 flex-1">
          {results.map((r) => (
            <li
              key={r.metricKey}
              className="flex items-start gap-2"
            >
              {r.pass ? (
                <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-label="Pass" />
              ) : (
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="Fail" />
              )}
              <div className="min-w-0">
                <p className={cn("text-[11px] font-medium leading-tight", r.pass ? "text-ink" : "text-danger-ink")}>
                  {r.metricKey.replace(/_/g, " ")}
                </p>
                {r.note && (
                  <p className="text-[10px] text-subtle mt-0.5 leading-tight">{r.note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Pass ratio bar */}
        <div>
          <div className="h-1 rounded-full bg-[#eceef6] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allPass ? "bg-success" : "bg-warning",
              )}
              style={{ width: `${total > 0 ? (passing / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface Props {
  personas: CekuraPersona[];
  progress: number;
  maxProgress: number;
}

export function PersonaGrid({ personas, progress, maxProgress }: Props) {
  const [view, setView] = useState<"all" | "hard" | "medium" | "easy">("all");

  const tabItems = [
    { id: "all", label: "All Personas", count: personas.length },
    { id: "hard", label: "Hard", count: personas.filter((p) => p.difficulty === "hard").length },
    { id: "medium", label: "Medium", count: personas.filter((p) => p.difficulty === "medium").length },
    { id: "easy", label: "Easy", count: personas.filter((p) => p.difficulty === "easy").length },
  ];

  const filtered = useMemo(() => {
    if (view === "all") return personas;
    return personas.filter((p) => p.difficulty === view);
  }, [personas, view]);

  const passedCount = useMemo(() => {
    return personas.filter((p) => {
      const results = personaResults(p, progress);
      return results.every((r) => r.pass);
    }).length;
  }, [personas, progress]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Persona Suite
          </p>
          <p className="text-xs text-muted mt-0.5">
            {passedCount}/{personas.length} personas fully passing at iteration {progress}
          </p>
        </div>
        <Tabs
          items={tabItems}
          active={view}
          onChange={(id) => setView(id as typeof view)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((persona, i) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            progress={progress}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
