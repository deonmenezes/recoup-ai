"use client";

import Link from "next/link";
import {
  ChevronRight,
  DollarSign,
  Users,
  TrendingUp,
  ShieldCheck,
  BarChart2,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAccounts } from "@/lib/store";
import { useAllActivities } from "@/lib/store";
import { useCall } from "@/components/call/CallProvider";
import { portfolioStats, CEKURA_RUN } from "@/lib/data";
import { moneyCompact, pct } from "@/lib/format";
import { KpiCard } from "./KpiCard";
import { ComplianceHero } from "./ComplianceHero";
import { PortfolioAging } from "./PortfolioAging";
import { AttentionQueue } from "./AttentionQueue";
import { RecentActivity } from "./RecentActivity";

// Fake sparkline trends (week-over-week shape, grounded in seed data)
const OUTSTANDING_TREND = [13200, 13800, 14250, 13900, 14100, 13750, 13282];
const PTP_RATE_TREND = [8, 10, 9, 11, 12, 13, 14];
const COMPLIANCE_TREND = [62, 78, 94, 100, 100, 100, 100];
const RECOVERY_TREND = [34, 35, 37, 36, 38, 38, 38];
const CONTACTABILITY_TREND = [60, 62, 64, 65, 66, 67, 67];

export function DashboardView() {
  const accounts = useAccounts();
  const recentActivity = useAllActivities(8);
  const { startCall } = useCall();
  const stats = portfolioStats(accounts);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-8">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">
            Good evening, Jordan
          </h1>
          <p className="mt-1 text-sm text-muted text-pretty">
            Here&rsquo;s your collections portfolio for today.
          </p>
        </div>
        <Link href="/accounts">
          <Button variant="primary" size="md" rightIcon={<ChevronRight className="size-4" />}>
            Open account book
          </Button>
        </Link>
      </motion.div>

      {/* ── KPI row ───────────────────────────────────────────────────────────── */}
      <section aria-label="Portfolio KPIs">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Total Outstanding"
            value={moneyCompact(stats.totalOutstanding)}
            icon={<DollarSign className="size-4" />}
            tone="primary"
            sparkData={OUTSTANDING_TREND}
            delta="Live balance"
            index={0}
          />
          <KpiCard
            label="Accounts in Collection"
            value={String(stats.accountsInCollection)}
            icon={<Users className="size-4" />}
            tone="info"
            delta={`${accounts.length} total`}
            index={1}
          />
          <KpiCard
            label="Promise-to-Pay Rate"
            value={pct(stats.promiseRate)}
            icon={<TrendingUp className="size-4" />}
            tone="success"
            sparkData={PTP_RATE_TREND}
            deltaUp
            delta="+3% this week"
            index={2}
          />
          <KpiCard
            label="Compliance Pass Rate"
            value={pct(CEKURA_RUN.finalScore)}
            icon={<ShieldCheck className="size-4" />}
            tone="success"
            sparkData={COMPLIANCE_TREND}
            deltaUp
            delta="100% Cekura"
            index={3}
          />
          <KpiCard
            label="Recovery Rate"
            value={pct(stats.recoveryRate)}
            icon={<BarChart2 className="size-4" />}
            tone="warning"
            sparkData={RECOVERY_TREND}
            delta="Industry avg 33%"
            index={4}
          />
          <KpiCard
            label="Contactability"
            value={pct(stats.contactability)}
            icon={<Radio className="size-4" />}
            tone="info"
            sparkData={CONTACTABILITY_TREND}
            deltaUp
            delta="+2% this week"
            index={5}
          />
        </div>
      </section>

      {/* ── Compliance hero + Portfolio aging ────────────────────────────────── */}
      <section aria-label="Compliance and aging" className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ComplianceHero />
        </div>
        <div className="xl:col-span-1">
          <PortfolioAging accounts={accounts} />
        </div>
      </section>

      {/* ── Attention queue + Recent activity ────────────────────────────────── */}
      <section aria-label="Queue and activity" className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AttentionQueue accounts={accounts} onCall={startCall} />
        <RecentActivity items={recentActivity} />
      </section>
    </div>
  );
}
