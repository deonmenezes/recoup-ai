"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

import { useAccounts } from "@/lib/store";
import { useCall } from "@/components/call/CallProvider";
import { money } from "@/lib/format";
import type { DebtorStatus } from "@/lib/types";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/primitives";
import { AccountsTable } from "./AccountsTable";

type SortKey = "balance" | "daysPastDue" | "lastContact" | "name";
type SortDir = "asc" | "desc";

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "delinquent", label: "Delinquent" },
  { id: "promise", label: "Promise" },
  { id: "dispute", label: "Dispute" },
  { id: "cease", label: "Cease" },
  { id: "paid", label: "Paid" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "balance", label: "Balance" },
  { key: "daysPastDue", label: "Days Past Due" },
  { key: "lastContact", label: "Last Contact" },
  { key: "name", label: "Name" },
];

export function AccountsView() {
  const accounts = useAccounts();
  const { startCall } = useCall();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>(searchParams.get("q") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  // Build counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: accounts.length };
    for (const a of accounts) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }, [accounts]);

  // Tab items with counts
  const tabItems = useMemo(
    () =>
      STATUS_TABS.map((t) => ({
        id: t.id,
        label: t.label,
        count: statusCounts[t.id] ?? 0,
      })),
    [statusCounts],
  );

  // Filter + search + sort
  const filtered = useMemo(() => {
    let list = accounts;

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === (statusFilter as DebtorStatus));
    }

    // Text search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.accountId.toLowerCase().includes(q) ||
          a.originalCreditor.toLowerCase().includes(q) ||
          a.phone.includes(q),
      );
    }

    // Sort
    const multiplier = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "balance":
          return (a.balance - b.balance) * multiplier;
        case "daysPastDue":
          return (a.daysPastDue - b.daysPastDue) * multiplier;
        case "lastContact": {
          const ta = a.lastContactISO ? new Date(a.lastContactISO).getTime() : 0;
          const tb = b.lastContactISO ? new Date(b.lastContactISO).getTime() : 0;
          return (ta - tb) * multiplier;
        }
        case "name":
          return a.name.localeCompare(b.name) * multiplier;
        default:
          return 0;
      }
    });

    return list;
  }, [accounts, statusFilter, query, sortKey, sortDir]);

  // Summary stats for the filtered set
  const totalOutstanding = useMemo(
    () => filtered.filter((a) => a.status !== "paid").reduce((s, a) => s + a.balance, 0),
    [filtered],
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <motion.div
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink lg:text-2xl">
              Accounts
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} in portfolio
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        {/* Status tabs */}
        <Tabs
          items={tabItems}
          active={statusFilter}
          onChange={setStatusFilter}
          className="px-4 pt-1"
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-b border-border">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              placeholder="Search name, account, creditor, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              aria-label="Search accounts"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium uppercase tracking-wide text-subtle flex items-center gap-1">
              <Filter className="size-3" aria-hidden />
              Sort
            </span>
            <div className="flex items-center gap-1">
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.key === sortKey;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSort(opt.key)}
                    aria-pressed={isActive}
                    className={`
                      inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer
                      ${isActive
                        ? "bg-primary-soft text-primary"
                        : "text-muted hover:bg-[#eef0f5] hover:text-ink"
                      }
                    `}
                  >
                    {opt.label}
                    {isActive ? (
                      sortDir === "desc" ? (
                        <ArrowDown className="size-3" aria-hidden />
                      ) : (
                        <ArrowUp className="size-3" aria-hidden />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-6 px-4 py-2.5 bg-canvas/60 border-b border-border text-xs">
          <span className="text-subtle">
            Showing{" "}
            <span className="font-semibold text-ink tnum">{filtered.length}</span>
            {statusFilter !== "all" && (
              <> &middot; <span className="text-primary">{STATUS_TABS.find((t) => t.id === statusFilter)?.label}</span></>
            )}
          </span>
          {filtered.length > 0 && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <span className="text-subtle">
                Outstanding{" "}
                <span className="font-semibold text-ink tnum">{money(totalOutstanding)}</span>
              </span>
            </>
          )}
          {query && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <span className="text-subtle">
                Filtered by &ldquo;{query}&rdquo;
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="ml-1.5 text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </span>
            </>
          )}
        </div>

        {/* Table / empty state */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="No accounts found"
            description={
              query
                ? `No results for "${query}". Try a different search term.`
                : "No accounts match the selected filter."
            }
            action={
              query || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setStatusFilter("all"); }}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <AccountsTable
            accounts={filtered}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onCall={startCall}
          />
        )}
      </motion.div>
    </div>
  );
}
