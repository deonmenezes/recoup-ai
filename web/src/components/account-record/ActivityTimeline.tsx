"use client";

import { motion } from "framer-motion";
import {
  Phone,
  CircleCheck,
  TriangleAlert,
  StickyNote,
  CircleDollarSign,
  FileText,
  Settings,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/primitives";
import { COMPLIANCE_CHECKS } from "@/lib/data";
import { dateTime, clock } from "@/lib/format";
import type { ActivityEvent, ActivityType } from "@/lib/types";
import { cn } from "@/lib/cn";

const TYPE_META: Record<
  ActivityType,
  { icon: React.ReactNode; bgClass: string; label: string }
> = {
  call: {
    icon: <Phone className="size-3.5" aria-hidden />,
    bgClass: "bg-primary-soft text-primary",
    label: "Call",
  },
  promise: {
    icon: <CircleCheck className="size-3.5" aria-hidden />,
    bgClass: "bg-success-soft text-success-ink",
    label: "Promise",
  },
  dispute: {
    icon: <TriangleAlert className="size-3.5" aria-hidden />,
    bgClass: "bg-warning-soft text-warning-ink",
    label: "Dispute",
  },
  cease: {
    icon: <Ban className="size-3.5" aria-hidden />,
    bgClass: "bg-danger-soft text-danger-ink",
    label: "Cease",
  },
  note: {
    icon: <StickyNote className="size-3.5" aria-hidden />,
    bgClass: "bg-[#eef0f5] text-muted",
    label: "Note",
  },
  payment: {
    icon: <CircleDollarSign className="size-3.5" aria-hidden />,
    bgClass: "bg-success-soft text-success-ink",
    label: "Payment",
  },
  disclosure: {
    icon: <FileText className="size-3.5" aria-hidden />,
    bgClass: "bg-info-soft text-info-ink",
    label: "Disclosure",
  },
  system: {
    icon: <Settings className="size-3.5" aria-hidden />,
    bgClass: "bg-[#eef0f5] text-subtle",
    label: "System",
  },
};

const OUTCOME_LABELS: Record<string, string> = {
  promise_to_pay: "Promise secured",
  dispute: "Disputed",
  cease: "Cease honored",
  no_answer: "No answer",
  refused: "No commitment",
  in_progress: "In progress",
};

const COMPLIANCE_MAP = Object.fromEntries(
  COMPLIANCE_CHECKS.map((c) => [c.key, c])
);

function TimelineItem({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const meta = TYPE_META[event.type] ?? TYPE_META.system;

  return (
    <div className="flex gap-3 group">
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full",
            meta.bgClass,
          )}
          aria-hidden
        >
          {meta.icon}
        </span>
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-border min-h-[24px]" aria-hidden />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-5 flex-1 min-w-0", isLast && "pb-0")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1">
          <p className="text-sm font-medium text-ink">{event.title}</p>
          <span className="text-[11px] text-subtle font-medium shrink-0 tnum">
            {dateTime(event.timestampISO)}
          </span>
        </div>

        {event.detail && (
          <p className="text-sm text-muted text-pretty mb-1.5">{event.detail}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {/* Actor */}
          <span className="text-[11px] text-subtle capitalize">{event.actor}</span>

          {/* Duration */}
          {event.durationMs && (
            <>
              <span className="text-[11px] text-border-strong">·</span>
              <span className="text-[11px] text-subtle tnum">{clock(event.durationMs)}</span>
            </>
          )}

          {/* Outcome */}
          {event.outcome && (
            <>
              <span className="text-[11px] text-border-strong">·</span>
              <Badge
                tone={
                  event.outcome === "promise_to_pay"
                    ? "success"
                    : event.outcome === "dispute"
                      ? "warning"
                      : event.outcome === "cease"
                        ? "danger"
                        : event.outcome === "no_answer"
                          ? "neutral"
                          : "neutral"
                }
                className="text-[11px] py-0"
              >
                {OUTCOME_LABELS[event.outcome] ?? event.outcome}
              </Badge>
            </>
          )}

          {/* Compliance chips */}
          {event.compliance?.map((key) => {
            const check = COMPLIANCE_MAP[key];
            if (!check) return null;
            return (
              <Badge key={key} tone="success" className="text-[11px] py-0">
                {check.short}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface Props {
  events: ActivityEvent[];
}

export function ActivityTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Phone className="size-5" />}
        title="No activity yet"
        description="Actions on this account — calls, promises, notes — will appear here."
      />
    );
  }

  return (
    <div className="px-5 py-4">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
        >
          <TimelineItem event={event} isLast={i === events.length - 1} />
        </motion.div>
      ))}
    </div>
  );
}
