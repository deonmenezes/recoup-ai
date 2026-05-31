"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Activity,
  FileText,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useAccount, useActivities } from "@/lib/store";
import { useCall } from "@/components/call/CallProvider";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/primitives";
import { RecordHeader } from "./RecordHeader";
import { ActionBar } from "./ActionBar";
import { ActivityTimeline } from "./ActivityTimeline";
import { DetailsTab } from "./DetailsTab";
import { ScriptTab } from "./ScriptTab";
import { ComplianceTab } from "./ComplianceTab";
import { CustomerPanel } from "./CustomerPanel";

const TAB_ITEMS = [
  { id: "activity", label: "Activity", icon: <Activity className="size-3.5" /> },
  { id: "details", label: "Details", icon: <FileText className="size-3.5" /> },
  { id: "script", label: "Script", icon: <ScrollText className="size-3.5" /> },
  { id: "compliance", label: "Compliance", icon: <ShieldCheck className="size-3.5" /> },
];

interface Props {
  id: string;
}

export function RecordView({ id }: Props) {
  const account = useAccount(id);
  const activities = useActivities(id);
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState("activity");

  if (!account) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Account not found"
          description={`No account with ID "${id}" exists in the portfolio.`}
          action={
            <Link href="/accounts">
              <Button variant="primary" size="md">
                Back to accounts
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleStartCall = () => startCall(account.accountId);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 space-y-4">
      {/* Breadcrumb */}
      <motion.nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href="/accounts"
          className="text-muted hover:text-ink transition-colors font-medium"
        >
          Accounts
        </Link>
        <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        <span className="text-ink font-medium truncate">{account.name}</span>
      </motion.nav>

      {/* Header card */}
      <RecordHeader account={account} />

      {/* Action bar */}
      <ActionBar account={account} onStartCall={handleStartCall} />

      {/* Main content + side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Main column — tabs */}
        <motion.div
          className="xl:col-span-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
        >
          <Card className="overflow-hidden">
            <Tabs
              items={TAB_ITEMS.map((t) =>
                t.id === "activity" ? { ...t, count: activities.length } : t,
              )}
              active={activeTab}
              onChange={setActiveTab}
              className="px-2 pt-1"
            />

            {activeTab === "activity" && (
              <ActivityTimeline events={activities} />
            )}
            {activeTab === "details" && <DetailsTab account={account} />}
            {activeTab === "script" && <ScriptTab />}
            {activeTab === "compliance" && <ComplianceTab />}
          </Card>
        </motion.div>

        {/* Right side panel */}
        <div className="xl:col-span-4 xl:sticky xl:top-6">
          <CustomerPanel
            account={account}
            recentActivities={activities.slice(0, 2).map((e) => ({
              title: e.title,
              timestampISO: e.timestampISO,
            }))}
            onStartCall={handleStartCall}
          />
        </div>
      </div>
    </div>
  );
}
