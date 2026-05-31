// ── Domain model for Recoup AI collections CRM ──────────────────────────────
// Mirrors the Pipecat voice-agent backend (server/mock_backend.py) and extends
// it with CRM concepts: activity history, risk, Cekura evaluation results.

export type DebtorStatus = "delinquent" | "promise" | "dispute" | "cease" | "paid";
export type RiskTier = "high" | "medium" | "low";
export type Language = "EN" | "ES";

export interface PaymentOption {
  id: string;
  label: string;
  description: string;
  /** Manager-approved options are not surfaced proactively by the agent. */
  managerApproved?: boolean;
}

export interface PromiseToPay {
  amount: number;
  /** When they will pay, in the debtor's own words ("this Friday"). */
  date: string;
  planId?: string | null;
  confirmation: string;
}

export interface Debtor {
  accountId: string;
  name: string;
  phone: string; // E.164
  email?: string;
  originalCreditor: string;
  balance: number;
  daysPastDue: number;
  dueDate: string; // human ("April 13th")
  minimumPayment: number;
  status: DebtorStatus;
  riskTier: RiskTier;
  /** Masked identity challenge shown to operators (never the raw value). */
  identityMask: { dob: string; ssnLast4: string };
  lastContactISO?: string;
  bestTime?: string;
  language: Language;
  /** One of the AVATAR_PALETTES keys for a deterministic gradient. */
  avatar: string;
  promise?: PromiseToPay | null;
}

// ── Activity timeline ───────────────────────────────────────────────────────
export type ActivityType =
  | "call"
  | "promise"
  | "dispute"
  | "cease"
  | "note"
  | "disclosure"
  | "payment"
  | "system";

export type Actor = "agent" | "system" | "human" | "debtor";

export interface ActivityEvent {
  id: string;
  accountId: string;
  type: ActivityType;
  title: string;
  detail?: string;
  timestampISO: string;
  actor: Actor;
  outcome?: CallOutcome;
  /** Compliance keys satisfied during this event (for call events). */
  compliance?: ComplianceKey[];
  durationMs?: number;
}

// ── Call console ────────────────────────────────────────────────────────────
export type ComplianceKey =
  | "right_party_verified"
  | "mini_miranda_given"
  | "stated_correct_balance"
  | "no_threats_or_harassment"
  | "no_third_party_disclosure"
  | "honored_cease_request";

export interface ComplianceCheck {
  key: ComplianceKey;
  label: string;
  short: string;
  /** Regulatory citation surfaced in the UI. */
  cite: string;
}

export type CallPhase = "idle" | "dialing" | "ringing" | "connected" | "wrapup" | "ended";

export type CallOutcome =
  | "promise_to_pay"
  | "dispute"
  | "cease"
  | "no_answer"
  | "refused"
  | "in_progress";

export type TurnRole = "agent" | "debtor" | "system";

export interface TranscriptTurn {
  id: string;
  role: TurnRole;
  text: string;
  /** ms offset from call connect — used to schedule the live playback. */
  at: number;
  /** Tool the agent invoked on this turn (e.g. "verify_identity"). */
  tool?: string;
  /** Compliance checks that flip green on this turn. */
  fires?: ComplianceKey[];
  /** Script step id this turn corresponds to. */
  step?: string;
}

export interface ScriptStep {
  id: string;
  label: string;
  description: string;
  tool?: string;
  compliance?: ComplianceKey;
}

export interface CallScenario {
  id: string;
  label: string;
  outcome: CallOutcome;
  description: string;
  turns: TranscriptTurn[];
}

// ── Cekura simulate → evaluate → auto-improve ───────────────────────────────
export interface CekuraMetric {
  key: string;
  label: string;
  kind: "compliance" | "effectiveness";
  description: string;
}

export interface PersonaResult {
  metricKey: string;
  pass: boolean;
  note?: string;
}

export interface CekuraPersona {
  id: string;
  name: string;
  scenario: string;
  tests: string;
  difficulty: "easy" | "medium" | "hard";
  baseline: PersonaResult[];
  improved: PersonaResult[];
}

export interface CekuraIteration {
  n: number;
  label: string;
  complianceScore: number; // 0-100
  ptpRate: number; // 0-100
  summary: string;
  diagnosis: string;
  fix: string;
  failuresFixed: string[];
}

export interface CekuraRun {
  agentName: string;
  model: string;
  baselineScore: number;
  finalScore: number;
  baselinePtp: number;
  finalPtp: number;
  metrics: CekuraMetric[];
  personas: CekuraPersona[];
  iterations: CekuraIteration[];
}

// ── Portfolio KPIs ──────────────────────────────────────────────────────────
export interface AgingBucket {
  label: string; // "1-30", "31-60", ...
  count: number;
  amount: number;
}
