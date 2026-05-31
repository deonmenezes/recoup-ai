"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  Clock,
  Lock,
  PhoneCall,
  PhoneOff,
  CircleCheck,
  TriangleAlert,
  BadgeCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/Badge";
import { Card, CardHeader, KeyValue, SectionLabel, Divider } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { money, money0, prettyPhone } from "@/lib/format";
import { RelTime } from "@/components/ui/RelTime";
import type { Debtor } from "@/lib/types";

const NEXT_BEST_ACTION: Record<
  Debtor["status"],
  { text: string; icon: React.ReactNode; buttonLabel: string; buttonVariant: "primary" | "secondary" | "ghost" | "success" | "danger" | "subtle"; disabled?: boolean }
> = {
  delinquent: {
    text: "Call now to secure a promise-to-pay.",
    icon: <PhoneCall className="size-4" aria-hidden />,
    buttonLabel: "Call now",
    buttonVariant: "primary",
  },
  promise: {
    text: "Promise active — monitor for first payment. No further outreach needed.",
    icon: <CircleCheck className="size-4" aria-hidden />,
    buttonLabel: "View promise",
    buttonVariant: "subtle",
  },
  dispute: {
    text: "Validation mailed — await response before next contact.",
    icon: <TriangleAlert className="size-4" aria-hidden />,
    buttonLabel: "View dispute",
    buttonVariant: "secondary",
  },
  cease: {
    text: "Do not contact — cease request honored. No outreach.",
    icon: <PhoneOff className="size-4" aria-hidden />,
    buttonLabel: "Do not call",
    buttonVariant: "ghost",
    disabled: true,
  },
  paid: {
    text: "Account resolved. No further action required.",
    icon: <BadgeCheck className="size-4" aria-hidden />,
    buttonLabel: "Resolved",
    buttonVariant: "ghost",
    disabled: true,
  },
};

interface Props {
  account: Debtor;
  recentActivities: Array<{ title: string; timestampISO: string }>;
  onStartCall: () => void;
}

export function CustomerPanel({ account, recentActivities, onStartCall }: Props) {
  const nba = NEXT_BEST_ACTION[account.status];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
    >
      {/* Customer card */}
      <Card>
        <CardHeader title="Customer" icon={<Phone className="size-4" />} />
        <Divider />
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={account.name} palette={account.avatar} size="md" ring />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{account.name}</p>
              <StatusPill status={account.status} />
            </div>
          </div>

          {/* Contact actions */}
          <div className="space-y-2 mb-4">
            <a
              href={`tel:${account.phone}`}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-[#eef0f5] transition-colors group"
            >
              <Phone className="size-4 text-primary shrink-0" aria-hidden />
              <span className="tnum font-medium">{prettyPhone(account.phone)}</span>
              <span className="ml-auto text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Call
              </span>
            </a>
            {account.email && (
              <a
                href={`mailto:${account.email}`}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-[#eef0f5] transition-colors group"
              >
                <Mail className="size-4 text-muted shrink-0" aria-hidden />
                <span className="truncate">{account.email}</span>
              </a>
            )}
          </div>

          {/* Key values */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <KeyValue
              label="Balance"
              value={<span className="text-primary font-bold tnum">{money(account.balance)}</span>}
            />
            <KeyValue
              label="Min payment"
              value={<span className="tnum">{money0(account.minimumPayment)}</span>}
            />
            <KeyValue
              label="Days past due"
              value={
                <span className={account.daysPastDue > 60 ? "text-danger-ink" : account.daysPastDue > 30 ? "text-warning-ink" : "text-ink"}>
                  {account.daysPastDue > 0 ? `${account.daysPastDue}d` : "—"}
                </span>
              }
            />
            <KeyValue label="Best time" value={account.bestTime ?? "—"} />
            <KeyValue
              label="Language"
              value={account.language === "ES" ? "Español" : "English"}
            />
            <KeyValue
              label="Last contact"
              value={
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-subtle" aria-hidden />
                  <RelTime iso={account.lastContactISO} />
                </span>
              }
            />
          </dl>
        </div>
      </Card>

      {/* Identity */}
      <Card>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="size-4 text-subtle" aria-hidden />
            <SectionLabel>Right-party verification</SectionLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KeyValue
              label="Date of birth"
              value={<span className="font-mono tnum text-xs">{account.identityMask.dob}</span>}
            />
            <KeyValue
              label="SSN last 4"
              value={<span className="font-mono tnum text-xs">{account.identityMask.ssnLast4}</span>}
            />
          </div>
          <p className="mt-2.5 text-[10px] text-subtle">
            Verified live on the call via{" "}
            <span className="font-mono text-primary">verify_identity</span>
          </p>
        </div>
      </Card>

      {/* Next best action */}
      <Card>
        <div className="px-5 py-4">
          <SectionLabel className="mb-3">Next best action</SectionLabel>
          <div className="flex items-start gap-2.5 mb-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden>
              {nba.icon}
            </span>
            <p className="text-sm text-muted text-pretty leading-relaxed">{nba.text}</p>
          </div>
          <Button
            variant={nba.buttonVariant}
            size="sm"
            className="w-full"
            // Only "Call now" has a real handler — disable the rest so no button
            // looks actionable while doing nothing.
            disabled={nba.disabled || nba.buttonLabel !== "Call now"}
            onClick={nba.buttonLabel === "Call now" ? onStartCall : undefined}
            leftIcon={nba.icon}
          >
            {nba.buttonLabel}
          </Button>
        </div>
      </Card>

      {/* Recent activity recap */}
      {recentActivities.length > 0 && (
        <Card>
          <div className="px-5 py-4">
            <SectionLabel className="mb-3">What happened</SectionLabel>
            <ul className="space-y-2.5">
              {recentActivities.slice(0, 2).map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink leading-snug">{ev.title}</p>
                    <p className="text-[11px] text-subtle tnum"><RelTime iso={ev.timestampISO} /></p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
