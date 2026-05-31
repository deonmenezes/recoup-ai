"use client";

import { BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader } from "@/components/ui/primitives";
import { BarRow } from "@/components/ui/charts";
import { money } from "@/lib/format";
import type { Debtor } from "@/lib/types";
import { agingBuckets } from "@/lib/data";

// Color ramp: success → warning → danger → danger-darker as age increases
const BUCKET_COLORS = [
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "#9f1239", // deeper rose for 90+
];

interface PortfolioAgingProps {
  accounts: Debtor[];
}

export function PortfolioAging({ accounts }: PortfolioAgingProps) {
  const buckets = agingBuckets(accounts);
  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="h-full flex flex-col">
        <CardHeader
          title="Portfolio aging"
          subtitle="Days past due distribution across active accounts"
          icon={<BarChart2 className="size-4" />}
        />

        <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
          {buckets.map((bucket, i) => (
            <div key={bucket.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{bucket.label} days</span>
                <span className="text-xs font-semibold text-muted tnum">
                  {bucket.count} acct{bucket.count !== 1 ? "s" : ""}
                </span>
              </div>
              <BarRow
                label=""
                value={bucket.amount}
                max={maxAmount}
                color={BUCKET_COLORS[i]}
                caption={money(bucket.amount)}
              />
            </div>
          ))}

          {buckets.every((b) => b.count === 0) && (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-sm text-subtle">No active aging data</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
