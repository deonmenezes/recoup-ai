"use client";

import Link from "next/link";
import { PhoneCall, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/Avatar";
import { RiskPill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";
import { attentionQueue } from "@/lib/data";
import type { Debtor } from "@/lib/types";

interface AttentionQueueProps {
  accounts: Debtor[];
  onCall: (accountId: string) => void;
}

export function AttentionQueue({ accounts, onCall }: AttentionQueueProps) {
  const queue = attentionQueue(accounts).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="flex flex-col">
        <CardHeader
          title="Accounts to call next"
          subtitle="Delinquent — sorted by recovery priority"
          icon={<PhoneCall className="size-4" />}
        />

        {queue.length === 0 ? (
          <EmptyState
            icon={<PhoneOff className="size-5" />}
            title="No delinquent accounts"
            description="All accounts are either paid, promised, or on hold."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border" role="list">
            {queue.map((account, i) => (
              <QueueRow key={account.accountId} account={account} index={i} onCall={onCall} />
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}

function QueueRow({
  account,
  index,
  onCall,
}: {
  account: Debtor;
  index: number;
  onCall: (id: string) => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.38 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-canvas/60 transition-colors duration-150">
        {/* Avatar linked to record */}
        <Link
          href={`/accounts/${account.accountId}`}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          tabIndex={-1}
          aria-label={`Open ${account.name}'s record`}
        >
          <Avatar name={account.name} palette={account.avatar} size="sm" />
        </Link>

        {/* Name + creditor */}
        <Link
          href={`/accounts/${account.accountId}`}
          className="flex min-w-0 flex-1 flex-col gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
        >
          <span className="text-sm font-semibold text-ink truncate group-hover:text-primary transition-colors duration-150">
            {account.name}
          </span>
          <span className="text-xs text-subtle truncate">{account.originalCreditor}</span>
        </Link>

        {/* Balance + risk */}
        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-sm font-bold tnum text-ink">{money(account.balance)}</span>
          <RiskPill risk={account.riskTier} />
        </div>

        {/* Days badge */}
        <div className="hidden md:flex shrink-0">
          <span className="inline-flex items-center rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger-ink tnum">
            {account.daysPastDue}d past due
          </span>
        </div>

        {/* Call button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<PhoneCall className="size-3.5" />}
          onClick={(e) => {
            e.preventDefault();
            onCall(account.accountId);
          }}
          aria-label={`Call ${account.name}`}
          className="shrink-0"
        >
          Call
        </Button>
      </div>
    </motion.li>
  );
}
