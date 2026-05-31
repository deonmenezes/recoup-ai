"use client";

import { motion } from "framer-motion";
import { CircleCheck, Lock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill, RiskPill, Badge } from "@/components/ui/Badge";
import { KeyValue, Card } from "@/components/ui/primitives";
import { money, money0 } from "@/lib/format";
import type { Debtor } from "@/lib/types";

interface Props {
  account: Debtor;
}

export function RecordHeader({ account }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 lg:gap-5">
          {/* Avatar */}
          <Avatar
            name={account.name}
            palette={account.avatar}
            size="lg"
            ring
            className="shrink-0"
          />

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">{account.name}</h1>
              <StatusPill status={account.status} />
              <RiskPill risk={account.riskTier} />
              <Badge tone="neutral" className="font-mono text-[11px]">
                {account.language === "ES" ? "Español" : "English"}
              </Badge>
            </div>
            <p className="text-xs font-mono text-subtle mb-3">{account.accountId}</p>

            {/* Promise banner */}
            {account.promise && (
              <div className="flex items-center gap-2 rounded-lg bg-success-soft border border-success/20 px-3 py-2 mb-3 w-fit max-w-full">
                <CircleCheck className="size-3.5 shrink-0 text-success-ink" aria-hidden />
                <span className="text-xs text-success-ink font-medium">
                  Promise to pay{" "}
                  <span className="font-semibold tnum">{money(account.promise.amount)}</span>{" "}
                  on{" "}
                  <span className="font-semibold">{account.promise.date}</span>
                  {" · "}
                  <span className="font-mono">{account.promise.confirmation}</span>
                </span>
              </div>
            )}

            {/* Key metrics row */}
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 mt-1">
              <KeyValue
                label="Original creditor"
                value={account.originalCreditor}
              />
              <KeyValue
                label="Balance"
                value={
                  <span className="text-primary font-bold text-base tnum">
                    {money(account.balance)}
                  </span>
                }
                mono
              />
              <KeyValue
                label="Days past due"
                value={
                  <span className={account.daysPastDue > 60 ? "text-danger-ink" : account.daysPastDue > 30 ? "text-warning-ink" : "text-ink"}>
                    {account.daysPastDue > 0 ? `${account.daysPastDue}d` : "—"}
                  </span>
                }
              />
              <KeyValue
                label="Original due date"
                value={account.dueDate}
              />
              <KeyValue
                label="Minimum payment"
                value={<span className="tnum">{money0(account.minimumPayment)}</span>}
                mono
              />
            </dl>
          </div>

          {/* Identity mask chip — desktop right edge */}
          <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 rounded-lg bg-[#eef0f5] border border-border px-3 py-2">
              <Lock className="size-3.5 text-subtle shrink-0" aria-hidden />
              <div className="text-[11px] text-subtle font-mono leading-tight">
                <span className="block">{account.identityMask.dob}</span>
                <span className="block">{account.identityMask.ssnLast4}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
