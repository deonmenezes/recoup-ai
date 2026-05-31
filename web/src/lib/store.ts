"use client";

// ── Client state store ──────────────────────────────────────────────────────
// Dependency-free external store (useSyncExternalStore) with localStorage
// persistence so demo actions — calls, promises, disputes, notes, and the
// Cekura self-improvement progress — survive reloads and feel real.

import { useMemo, useSyncExternalStore } from "react";
import {
  CEKURA_RUN,
  SEED_ACTIVITIES,
  SEED_DEBTORS,
} from "./data";
import type { ActivityEvent, CallOutcome, ComplianceKey, Debtor } from "./types";

export interface AppState {
  accounts: Debtor[];
  /** Newest-first activity per accountId. */
  activities: Record<string, ActivityEvent[]>;
  /** Index of the latest applied Cekura iteration (0 = baseline). */
  cekuraProgress: number;
}

const STORAGE_KEY = "recoup-ai-state-v3";

function buildInitial(): AppState {
  const activities: Record<string, ActivityEvent[]> = {};
  for (const ev of SEED_ACTIVITIES) {
    (activities[ev.accountId] ??= []).push(ev);
  }
  for (const id of Object.keys(activities)) {
    activities[id].sort((a, b) => +new Date(b.timestampISO) - +new Date(a.timestampISO));
  }
  return {
    accounts: SEED_DEBTORS.map((d) => ({ ...d })),
    activities,
    cekuraProgress: CEKURA_RUN.iterations.length - 1, // demo opens at the improved state
  };
}

// Deterministic snapshot shared by SSR and the first client render (no mismatch).
const SERVER_STATE: AppState = buildInitial();
let state: AppState = SERVER_STATE;
let hydrated = false;

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function setState(next: AppState) {
  state = next;
  persist();
  emit();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Load persisted state after mount (keeps first render === server render). */
export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.accounts?.length) {
        state = parsed;
        emit();
      }
    }
  } catch {
    /* ignore corrupt state */
  }
}

// ── Subscriptions ───────────────────────────────────────────────────────────
function useRoot(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export function useAccounts(): Debtor[] {
  return useRoot().accounts;
}

export function useAccount(id: string): Debtor | undefined {
  const s = useRoot();
  return useMemo(() => s.accounts.find((a) => a.accountId === id), [s, id]);
}

export function useActivities(id: string): ActivityEvent[] {
  const s = useRoot();
  return useMemo(() => s.activities[id] ?? [], [s, id]);
}

export function useCekuraProgress(): number {
  return useRoot().cekuraProgress;
}

/** Flattened, newest-first activity across every account (for the dashboard). */
export function useAllActivities(limit = 12): { event: ActivityEvent; account?: Debtor }[] {
  const s = useRoot();
  return useMemo(() => {
    const byId = new Map(s.accounts.map((a) => [a.accountId, a]));
    return Object.values(s.activities)
      .flat()
      .sort((a, b) => +new Date(b.timestampISO) - +new Date(a.timestampISO))
      .slice(0, limit)
      .map((event) => ({ event, account: byId.get(event.accountId) }));
  }, [s, limit]);
}

// ── Mutations ────────────────────────────────────────────────────────────────
let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

function prependActivity(id: string, ev: ActivityEvent): Record<string, ActivityEvent[]> {
  return { ...state.activities, [id]: [ev, ...(state.activities[id] ?? [])] };
}

function patchAccount(id: string, patch: Partial<Debtor>): Debtor[] {
  return state.accounts.map((a) => (a.accountId === id ? { ...a, ...patch } : a));
}

export function logActivity(
  accountId: string,
  ev: Omit<ActivityEvent, "id" | "accountId" | "timestampISO"> & { timestampISO?: string },
): ActivityEvent {
  const full: ActivityEvent = {
    id: uid("ev"),
    accountId,
    timestampISO: ev.timestampISO ?? new Date().toISOString(),
    ...ev,
  };
  setState({ ...state, activities: prependActivity(accountId, full) });
  return full;
}

export function recordCall(
  accountId: string,
  opts: {
    outcome: CallOutcome;
    durationMs: number;
    compliance: ComplianceKey[];
    summary: string;
  },
) {
  const titles: Record<CallOutcome, string> = {
    promise_to_pay: "Outbound call — promise-to-pay secured",
    dispute: "Outbound call — debt disputed",
    cease: "Outbound call — cease honored",
    no_answer: "Outbound call — no answer",
    refused: "Outbound call — no commitment",
    in_progress: "Outbound call",
  };
  logActivity(accountId, {
    type: "call",
    title: titles[opts.outcome],
    detail: opts.summary,
    actor: "agent",
    outcome: opts.outcome,
    compliance: opts.compliance,
    durationMs: opts.durationMs,
  });
  setState({ ...state, accounts: patchAccount(accountId, { lastContactISO: new Date().toISOString() }) });
}

export function recordPromise(
  accountId: string,
  promise: { amount: number; date: string; planId?: string | null },
) {
  const confirmation = `PTP-${Math.floor(100000 + Math.random() * 899999)}`;
  setState({
    ...state,
    accounts: patchAccount(accountId, { status: "promise", promise: { ...promise, confirmation } }),
  });
  logActivity(accountId, {
    type: "promise",
    title: `Promise-to-pay captured · ${confirmation}`,
    detail: `$${promise.amount.toFixed(2)} on ${promise.date}. Read back and confirmed.`,
    actor: "agent",
  });
  return confirmation;
}

export function recordDispute(accountId: string, reason: string) {
  setState({ ...state, accounts: patchAccount(accountId, { status: "dispute", promise: null }) });
  logActivity(accountId, {
    type: "dispute",
    title: "Dispute recorded — validation mailed",
    detail: `${reason} Collection paused; written validation queued per FDCPA §1692g.`,
    actor: "agent",
  });
}

export function recordCease(accountId: string) {
  setState({ ...state, accounts: patchAccount(accountId, { status: "cease", promise: null }) });
  logActivity(accountId, {
    type: "cease",
    title: "Cease-communication request honored",
    detail: "Do-not-contact logged. No further outreach will be attempted (FDCPA §1692c(c)).",
    actor: "agent",
    compliance: ["honored_cease_request"],
  });
}

export function addNote(accountId: string, text: string) {
  logActivity(accountId, {
    type: "note",
    title: "Note added",
    detail: text,
    actor: "human",
  });
}

export function setCekuraProgress(n: number) {
  const clamped = Math.max(0, Math.min(CEKURA_RUN.iterations.length - 1, n));
  setState({ ...state, cekuraProgress: clamped });
}

export function resetDemo() {
  setState(buildInitial());
}
