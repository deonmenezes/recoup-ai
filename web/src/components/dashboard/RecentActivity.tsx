"use client";

import Link from "next/link";
import {
  Phone,
  FileText,
  ShieldAlert,
  PhoneOff,
  DollarSign,
  Bell,
  Cpu,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, Tooltip } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { COMPLIANCE_CHECKS } from "@/lib/data";
import { RelTime } from "@/components/ui/RelTime";
import type { ActivityEvent, ActivityType, ComplianceKey } from "@/lib/types";
import type { Debtor } from "@/lib/types";
import { TONE_HEX } from "@/components/ui/tones";

const TYPE_ICON: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="size-3.5" />,
  promise: <DollarSign className="size-3.5" />,
  dispute: <ShieldAlert className="size-3.5" />,
  cease: <PhoneOff className="size-3.5" />,
  note: <FileText className="size-3.5" />,
  disclosure: <Bell className="size-3.5" />,
  payment: <DollarSign className="size-3.5" />,
  system: <Cpu className="size-3.5" />,
};

const TYPE_COLOR: Record<ActivityType, string> = {
  call: TONE_HEX.primary,
  promise: TONE_HEX.success,
  dispute: TONE_HEX.warning,
  cease: TONE_HEX.neutral,
  note: TONE_HEX.info,
  disclosure: TONE_HEX.info,
  payment: TONE_HEX.success,
  system: TONE_HEX.neutral,
};

const COMPLIANCE_LABEL = Object.fromEntries(
  COMPLIANCE_CHECKS.map((c) => [c.key, c.short]),
) as Record<ComplianceKey, string>;

interface RecentActivityProps {
  items: { event: ActivityEvent; account?: Debtor }[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="flex flex-col">
        <CardHeader
          title="Latest activity"
          subtitle="Across all accounts — most recent first"
          icon={<Activity className="size-4" />}
        />

        {items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-subtle">No activity yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {items.map(({ event, account }, i) => (
              <ActivityRow key={event.id} event={event} account={account} index={i} />
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}

function ActivityRow({
  event,
  account,
  index,
}: {
  event: ActivityEvent;
  account?: Debtor;
  index: number;
}) {
  const icon = TYPE_ICON[event.type];
  const iconColor = TYPE_COLOR[event.type];

  return (
    <motion.li
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.44 + index * 0.035, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/accounts/${event.accountId}`}
        className="flex items-start gap-3 px-5 py-3 hover:bg-canvas/60 transition-colors duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
      >
        {/* Icon chip */}
        <span
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${iconColor}18`, color: iconColor }}
          aria-hidden
        >
          {icon}
        </span>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors duration-150 leading-tight">
              {event.title}
            </span>
            <time
              className="shrink-0 text-xs text-subtle tnum"
              dateTime={event.timestampISO}
              title={event.timestampISO}
            >
              <RelTime iso={event.timestampISO} />
            </time>
          </div>

          {account && (
            <span className="text-xs text-subtle">{account.name}</span>
          )}

          {/* Compliance chips */}
          {event.compliance && event.compliance.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {event.compliance.slice(0, 3).map((key) => (
                <Tooltip key={key} label={key.replace(/_/g, " ")} side="top">
                  <Badge tone="success" className="text-[10px] py-0 px-1.5">
                    {COMPLIANCE_LABEL[key] ?? key}
                  </Badge>
                </Tooltip>
              ))}
              {event.compliance.length > 3 && (
                <Badge tone="neutral" className="text-[10px] py-0 px-1.5">
                  +{event.compliance.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.li>
  );
}
