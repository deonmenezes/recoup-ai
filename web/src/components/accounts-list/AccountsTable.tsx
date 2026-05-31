"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PhoneCall, ExternalLink, Clock, ArrowUp, ArrowDown, ArrowUpDown, Ban } from "lucide-react";
import Link from "next/link";

import type { Debtor } from "@/lib/types";
import { money, relativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill, RiskPill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type SortKey = "balance" | "daysPastDue" | "lastContact" | "name";
type SortDir = "asc" | "desc";

interface AccountsTableProps {
  accounts: Debtor[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onCall: (accountId: string) => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="size-3 opacity-30 ml-1 inline" aria-hidden />;
  return sortDir === "desc"
    ? <ArrowDown className="size-3 ml-1 inline text-primary" aria-hidden />
    : <ArrowUp className="size-3 ml-1 inline text-primary" aria-hidden />;
}

function DaysSeverity({ days }: { days: number }) {
  if (days === 0) return null;
  const cls =
    days >= 90 ? "bg-danger-soft text-danger-ink" :
    days >= 60 ? "bg-warning-soft text-warning-ink" :
    days >= 30 ? "bg-warning-soft/60 text-warning-ink" :
    "bg-[#eef0f5] text-muted";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tnum", cls)}>
      {days}d
    </span>
  );
}

function CallableButton({
  account,
  onCall,
}: {
  account: Debtor;
  onCall: (id: string) => void;
}) {
  const blocked = account.status === "cease" || account.status === "paid";
  const tooltipLabel =
    account.status === "cease"
      ? "Do-not-contact (FDCPA §1692c)"
      : account.status === "paid"
      ? "Account resolved — no outreach needed"
      : "";

  if (blocked) {
    return (
      <Tooltip label={tooltipLabel} side="top">
        <Button
          variant="subtle"
          size="sm"
          leftIcon={<Ban className="size-3.5" />}
          disabled
          aria-disabled="true"
          aria-label={`Cannot call ${account.name} — ${tooltipLabel}`}
          onClick={(e) => e.stopPropagation()}
        >
          Call
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      leftIcon={<PhoneCall className="size-3.5" />}
      aria-label={`Call ${account.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onCall(account.accountId);
      }}
    >
      Call
    </Button>
  );
}

/* ── Desktop table row ────────────────────────────────────────────────────── */
function TableRow({
  account,
  index,
  onCall,
}: {
  account: Debtor;
  index: number;
  onCall: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <motion.tr
      role="row"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.32) }}
      className={cn(
        "group cursor-pointer transition-colors hover:bg-primary-softer/40",
        index % 2 === 0 ? "bg-white" : "bg-canvas/40",
      )}
      onClick={() => router.push("/accounts/" + account.accountId)}
    >
      {/* Account */}
      <td className="py-3 pl-4 pr-3 sm:pl-6" role="cell">
        <div className="flex items-center gap-3">
          <Avatar
            name={account.name}
            palette={account.avatar}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              href={"/accounts/" + account.accountId}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-ink hover:text-primary transition-colors truncate block"
            >
              {account.name}
            </Link>
            <span className="text-[11px] text-subtle tnum font-mono">{account.accountId}</span>
          </div>
        </div>
      </td>

      {/* Creditor */}
      <td className="hidden px-3 py-3 sm:table-cell whitespace-nowrap" role="cell">
        <span className="text-sm text-muted">{account.originalCreditor}</span>
      </td>

      {/* Balance */}
      <td className="px-3 py-3 text-right" role="cell">
        <span className={cn("text-sm font-semibold tnum", account.balance === 0 ? "text-subtle" : "text-ink")}>
          {money(account.balance)}
        </span>
      </td>

      {/* Days past due */}
      <td className="hidden px-3 py-3 lg:table-cell text-center" role="cell">
        {account.daysPastDue > 0 ? (
          <DaysSeverity days={account.daysPastDue} />
        ) : (
          <span className="text-[11px] text-subtle">—</span>
        )}
      </td>

      {/* Status */}
      <td className="hidden px-3 py-3 md:table-cell" role="cell">
        <StatusPill status={account.status} />
      </td>

      {/* Risk */}
      <td className="hidden px-3 py-3 xl:table-cell" role="cell">
        <RiskPill risk={account.riskTier} />
      </td>

      {/* Last contact */}
      <td className="hidden px-3 py-3 lg:table-cell whitespace-nowrap" role="cell">
        {account.lastContactISO ? (
          <span className="text-sm text-muted flex items-center gap-1">
            <Clock className="size-3.5 shrink-0 text-subtle" aria-hidden />
            {relativeTime(account.lastContactISO)}
          </span>
        ) : (
          <span className="text-sm text-faint">Never</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 pl-3 pr-4 sm:pr-6 text-right" role="cell">
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <CallableButton account={account} onCall={onCall} />
          <Link
            href={"/accounts/" + account.accountId}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${account.name}'s account`}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-[#eef0f5] hover:text-ink transition-colors"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}

/* ── Mobile card row ──────────────────────────────────────────────────────── */
function MobileCard({
  account,
  index,
  onCall,
}: {
  account: Debtor;
  index: number;
  onCall: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.32) }}
      className="flex flex-col gap-3 px-4 py-4 border-b border-border cursor-pointer hover:bg-primary-softer/30 transition-colors"
      role="listitem"
      onClick={() => router.push("/accounts/" + account.accountId)}
    >
      {/* Top: avatar + name + account id + status */}
      <div className="flex items-center gap-3">
        <Avatar name={account.name} palette={account.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink truncate">{account.name}</span>
            <StatusPill status={account.status} />
          </div>
          <span className="text-[11px] text-subtle tnum font-mono">{account.accountId}</span>
        </div>
        <RiskPill risk={account.riskTier} />
      </div>

      {/* Middle: creditor + balance + DPD */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-subtle font-medium">Creditor</p>
          <p className="text-sm text-muted truncate">{account.originalCreditor}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] uppercase tracking-wide text-subtle font-medium">Balance</p>
          <p className={cn("text-sm font-semibold tnum", account.balance === 0 ? "text-subtle" : "text-ink")}>
            {money(account.balance)}
          </p>
        </div>
        {account.daysPastDue > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[11px] uppercase tracking-wide text-subtle font-medium">DPD</p>
            <DaysSeverity days={account.daysPastDue} />
          </div>
        )}
      </div>

      {/* Bottom: last contact + actions */}
      <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        {account.lastContactISO ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5 text-subtle shrink-0" aria-hidden />
            {relativeTime(account.lastContactISO)}
          </span>
        ) : (
          <span className="text-xs text-faint">No contact yet</span>
        )}
        <div className="flex items-center gap-2">
          <CallableButton account={account} onCall={onCall} />
          <Link
            href={"/accounts/" + account.accountId}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${account.name}'s account`}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-[#eef0f5] hover:text-ink transition-colors border border-border"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main exported component ──────────────────────────────────────────────── */
export function AccountsTable({ accounts, sortKey, sortDir, onSort, onCall }: AccountsTableProps) {
  function thProps(col: SortKey) {
    const isActive = col === sortKey;
    return {
      "aria-sort": (isActive
        ? sortDir === "asc" ? "ascending" : "descending"
        : "none") as React.AriaAttributes["aria-sort"],
      onClick: () => onSort(col),
    };
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full" role="table" aria-label="Accounts list">
          <thead>
            <tr className="border-b border-border bg-canvas/70" role="row">
              <th
                scope="col"
                className="py-2.5 pl-4 pr-3 sm:pl-6 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle cursor-pointer hover:text-ink transition-colors"
                {...thProps("name")}
              >
                Account
                <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle sm:table-cell"
              >
                Creditor
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-subtle cursor-pointer hover:text-ink transition-colors"
                {...thProps("balance")}
              >
                Balance
                <SortIcon col="balance" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-subtle cursor-pointer hover:text-ink transition-colors lg:table-cell"
                {...thProps("daysPastDue")}
              >
                DPD
                <SortIcon col="daysPastDue" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle md:table-cell"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle xl:table-cell"
              >
                Risk
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle cursor-pointer hover:text-ink transition-colors lg:table-cell"
                {...thProps("lastContact")}
              >
                Last Contact
                <SortIcon col="lastContact" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                scope="col"
                className="py-2.5 pl-3 pr-4 sm:pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-subtle"
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y divide-border/60">
            {accounts.map((account, i) => (
              <TableRow
                key={account.accountId}
                account={account}
                index={i}
                onCall={onCall}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden" role="list" aria-label="Accounts list">
        {accounts.map((account, i) => (
          <MobileCard
            key={account.accountId}
            account={account}
            index={i}
            onCall={onCall}
          />
        ))}
      </div>
    </>
  );
}
