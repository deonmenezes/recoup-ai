// ── Seed data for Recoup AI ─────────────────────────────────────────────────
// Grounded in the existing voice-agent workflow:
//   • server/mock_backend.py  → DEBTORS, PAYMENT_OPTIONS
//   • server/bot-nemotron.py  → agent "Riley", the 7 tools, the compliant script
//   • PRD.md §8/§9/§10        → Cekura personas, metrics, self-improvement loop
// All data is fake (no real PII / payments), matching the hackathon backend.

import type {
  ActivityEvent,
  CekuraRun,
  ComplianceCheck,
  Debtor,
  DebtorStatus,
  PaymentOption,
  RiskTier,
  ScriptStep,
} from "./types";

// ── Avatar gradients (deterministic per debtor) ─────────────────────────────
export const AVATAR_PALETTES: Record<string, [string, string]> = {
  indigo: ["#6366f1", "#4338ca"],
  violet: ["#8b5cf6", "#6d28d9"],
  emerald: ["#10b981", "#047857"],
  amber: ["#f59e0b", "#b45309"],
  rose: ["#fb7185", "#be123c"],
  sky: ["#38bdf8", "#0369a1"],
  teal: ["#2dd4bf", "#0f766e"],
  fuchsia: ["#e879f9", "#a21caf"],
  slate: ["#94a3b8", "#475569"],
};

// ── Status + risk presentation tokens ───────────────────────────────────────
export type Tone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS_META: Record<DebtorStatus, { label: string; tone: Tone; desc: string }> = {
  delinquent: { label: "Delinquent", tone: "danger", desc: "Past due — eligible for outreach" },
  promise: { label: "Promise to Pay", tone: "success", desc: "Active promise-to-pay on file" },
  dispute: { label: "Disputed", tone: "warning", desc: "Collection paused — validation mailed" },
  cease: { label: "Cease Contact", tone: "neutral", desc: "Do-not-contact honored (FDCPA §1692c(c))" },
  paid: { label: "Paid / Resolved", tone: "info", desc: "Balance resolved" },
};

export const RISK_META: Record<RiskTier, { label: string; tone: Tone }> = {
  high: { label: "High risk", tone: "danger" },
  medium: { label: "Medium risk", tone: "warning" },
  low: { label: "Low risk", tone: "success" },
};

// ── Payment / resolution options (server/mock_backend.py PAYMENT_OPTIONS) ────
export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "pay_in_full",
    label: "Pay the full balance today",
    description: "Settles the account immediately, no further interest or fees.",
  },
  {
    id: "plan_3mo",
    label: "Three-month plan",
    description: "Split the balance into 3 equal monthly payments, no fee.",
  },
  {
    id: "plan_6mo",
    label: "Six-month plan",
    description: "Split the balance into 6 smaller monthly payments.",
  },
  {
    id: "settlement",
    label: "One-time settlement",
    description: "Settle for 70% of the balance in a single payment (manager-approved).",
    managerApproved: true,
  },
];

// ── FDCPA compliance checklist (bot-nemotron.py HARD COMPLIANCE RULES) ───────
export const COMPLIANCE_CHECKS: ComplianceCheck[] = [
  {
    key: "right_party_verified",
    label: "Right-party verified before disclosure",
    short: "Right-party verified",
    cite: "FDCPA §1692b",
  },
  {
    key: "mini_miranda_given",
    label: "Mini-Miranda disclosure delivered",
    short: "Mini-Miranda given",
    cite: "FDCPA §1692e(11)",
  },
  {
    key: "stated_correct_balance",
    label: "Stated the exact, accurate balance",
    short: "Accurate balance",
    cite: "FDCPA §1692e(2)",
  },
  {
    key: "no_threats_or_harassment",
    label: "No threats, harassment, or escalation",
    short: "No harassment",
    cite: "FDCPA §1692d",
  },
  {
    key: "no_third_party_disclosure",
    label: "No debt disclosure to a third party",
    short: "No 3rd-party disclosure",
    cite: "FDCPA §1692c(b)",
  },
  {
    key: "honored_cease_request",
    label: "Honored any cease-communication request",
    short: "Honored cease",
    cite: "FDCPA §1692c(c)",
  },
];

// ── Riley's compliant call script (bot-nemotron.py NORMAL FLOW) ─────────────
export const SCRIPT_STEPS: ScriptStep[] = [
  {
    id: "greet",
    label: "Greeting & right-party ask",
    description:
      "Warm greeting; ask if speaking with the right party. Never name the creditor or imply a debt before verification.",
    compliance: "no_third_party_disclosure",
  },
  {
    id: "verify",
    label: "Verify identity",
    description: "Collect DOB or last-4 SSN, then verify. Max two attempts.",
    tool: "verify_identity",
    compliance: "right_party_verified",
  },
  {
    id: "miranda",
    label: "Mini-Miranda disclosure",
    description:
      '"This is an attempt to collect a debt, and any information obtained will be used for that purpose. This call may be recorded."',
    tool: "give_required_disclosure",
    compliance: "mini_miranda_given",
  },
  {
    id: "disclose",
    label: "State creditor & exact balance",
    description: "Name the original creditor and the exact balance including cents.",
    tool: "get_account_details",
    compliance: "stated_correct_balance",
  },
  {
    id: "negotiate",
    label: "Request payment / offer plans",
    description: "Ask for payment in full first, then offer plan options in order.",
    tool: "get_payment_options",
  },
  {
    id: "ptp",
    label: "Capture promise-to-pay",
    description: "Record the committed amount + date, then read it back.",
    tool: "log_promise_to_pay",
  },
  {
    id: "wrapup",
    label: "Confirm & close",
    description: "Confirm next steps, thank them, and end the call with a goodbye.",
    tool: "end_call",
  },
];

export const AGENT_TOOLS: { name: string; purpose: string }[] = [
  { name: "verify_identity", purpose: "Right-party check on DOB or last-4 SSN before any disclosure." },
  { name: "give_required_disclosure", purpose: "Marks the mini-Miranda as spoken verbatim." },
  { name: "get_account_details", purpose: "Returns creditor + exact balance (gated on verify + Miranda)." },
  { name: "get_payment_options", purpose: "Lists pay-in-full and no-fee plans (settlement withheld)." },
  { name: "log_promise_to_pay", purpose: "Records committed amount + date; issues confirmation." },
  { name: "record_dispute", purpose: "Marks the debt disputed; hard-stops collection on the call." },
  { name: "honor_cease_request", purpose: "Logs a do-not-contact request; hard-stops and closes." },
  { name: "end_call", purpose: "Ends the call after the spoken goodbye." },
];

// ── Debtor book (server/mock_backend.py DEBTORS + CRM extensions) ───────────
export const SEED_DEBTORS: Debtor[] = [
  {
    accountId: "RC-48213",
    name: "Deon Menezes",
    phone: "+16282466113",
    email: "deon.m@example.com",
    originalCreditor: "Summit Bank Visa",
    balance: 1284.57,
    daysPastDue: 47,
    dueDate: "April 13th",
    minimumPayment: 75.0,
    status: "delinquent",
    riskTier: "high",
    identityMask: { dob: "••/••/1998", ssnLast4: "•••-••-4417" },
    lastContactISO: "2026-05-28T17:12:00",
    bestTime: "Weekdays 6–8 PM",
    language: "EN",
    avatar: "indigo",
    promise: null,
  },
  {
    accountId: "RC-50991",
    name: "Maria Alvarez",
    phone: "+14155550142",
    email: "m.alvarez@example.com",
    originalCreditor: "Lumen Auto Finance",
    balance: 3920.0,
    daysPastDue: 92,
    dueDate: "March 1st",
    minimumPayment: 210.0,
    status: "delinquent",
    riskTier: "high",
    identityMask: { dob: "••/••/1985", ssnLast4: "•••-••-8830" },
    lastContactISO: "2026-05-26T22:40:00",
    bestTime: "Weekdays 12–2 PM",
    language: "ES",
    avatar: "rose",
    promise: null,
  },
  {
    accountId: "RC-51220",
    name: "James Carter",
    phone: "+13125550188",
    email: "j.carter@example.com",
    originalCreditor: "Northwind Personal Loan",
    balance: 642.1,
    daysPastDue: 21,
    dueDate: "May 9th",
    minimumPayment: 50.0,
    status: "delinquent",
    riskTier: "medium",
    identityMask: { dob: "••/••/1991", ssnLast4: "•••-••-1190" },
    lastContactISO: "2026-05-29T15:05:00",
    bestTime: "Weekends 10 AM–12 PM",
    language: "EN",
    avatar: "sky",
    promise: null,
  },
  {
    accountId: "RC-49120",
    name: "Priya Nair",
    phone: "+16179550110",
    email: "priya.nair@example.com",
    originalCreditor: "Cedar Card Services",
    balance: 2210.4,
    daysPastDue: 38,
    dueDate: "April 22nd",
    minimumPayment: 120.0,
    status: "promise",
    riskTier: "medium",
    identityMask: { dob: "••/••/1990", ssnLast4: "•••-••-7745" },
    lastContactISO: "2026-05-29T19:24:00",
    bestTime: "Weekdays 7–9 PM",
    language: "EN",
    avatar: "violet",
    promise: { amount: 120.0, date: "this Friday", planId: "plan_6mo", confirmation: "PTP-704182" },
  },
  {
    accountId: "RC-52310",
    name: "Marcus Webb",
    phone: "+12065550173",
    email: "m.webb@example.com",
    originalCreditor: "Atlas BNPL",
    balance: 489.0,
    daysPastDue: 16,
    dueDate: "May 14th",
    minimumPayment: 40.0,
    status: "dispute",
    riskTier: "low",
    identityMask: { dob: "••/••/1996", ssnLast4: "•••-••-2261" },
    lastContactISO: "2026-05-27T16:48:00",
    bestTime: "Weekdays 5–7 PM",
    language: "EN",
    avatar: "amber",
    promise: null,
  },
  {
    accountId: "RC-50044",
    name: "Sofia Reyes",
    phone: "+13055550129",
    email: "s.reyes@example.com",
    originalCreditor: "Lumen Auto Finance",
    balance: 1750.25,
    daysPastDue: 64,
    dueDate: "March 28th",
    minimumPayment: 95.0,
    status: "cease",
    riskTier: "medium",
    identityMask: { dob: "••/••/1988", ssnLast4: "•••-••-5502" },
    lastContactISO: "2026-05-24T18:10:00",
    bestTime: "—",
    language: "ES",
    avatar: "teal",
    promise: null,
  },
  {
    accountId: "RC-53001",
    name: "Aisha Bello",
    phone: "+14045550196",
    email: "a.bello@example.com",
    originalCreditor: "Northwind Personal Loan",
    balance: 980.0,
    daysPastDue: 34,
    dueDate: "April 26th",
    minimumPayment: 65.0,
    status: "delinquent",
    riskTier: "medium",
    identityMask: { dob: "••/••/1993", ssnLast4: "•••-••-3398" },
    lastContactISO: "2026-05-25T14:32:00",
    bestTime: "Weekdays 1–3 PM",
    language: "EN",
    avatar: "fuchsia",
    promise: null,
  },
  {
    accountId: "RC-48890",
    name: "David Kim",
    phone: "+12135550154",
    email: "d.kim@example.com",
    originalCreditor: "Summit Bank Visa",
    balance: 0.0,
    daysPastDue: 0,
    dueDate: "Resolved May 21st",
    minimumPayment: 0.0,
    status: "paid",
    riskTier: "low",
    identityMask: { dob: "••/••/1987", ssnLast4: "•••-••-9012" },
    lastContactISO: "2026-05-21T11:02:00",
    bestTime: "—",
    language: "EN",
    avatar: "emerald",
    promise: null,
  },
  {
    accountId: "RC-52777",
    name: "Liam O'Brien",
    phone: "+16465550188",
    email: "liam.ob@example.com",
    originalCreditor: "Cedar Card Services",
    balance: 1532.8,
    daysPastDue: 58,
    dueDate: "April 2nd",
    minimumPayment: 85.0,
    status: "delinquent",
    riskTier: "high",
    identityMask: { dob: "••/••/1994", ssnLast4: "•••-••-6604" },
    lastContactISO: "2026-05-23T20:15:00",
    bestTime: "Weekdays 6–8 PM",
    language: "EN",
    avatar: "slate",
    promise: null,
  },
];

// ── Seeded activity history ("what happened with the customer") ─────────────
export const SEED_ACTIVITIES: ActivityEvent[] = [
  // Deon — rich history (the demo account)
  {
    id: "a-deon-1",
    accountId: "RC-48213",
    type: "system",
    title: "Account placed for collection",
    detail: "Summit Bank Visa — charged off and assigned to Recoup AI portfolio.",
    timestampISO: "2026-05-02T09:00:00",
    actor: "system",
  },
  {
    id: "a-deon-2",
    accountId: "RC-48213",
    type: "call",
    title: "Outbound call — no answer",
    detail: "Rang for 28s, no answer. No voicemail left (debt-implying message withheld).",
    timestampISO: "2026-05-12T18:05:00",
    actor: "agent",
    outcome: "no_answer",
    durationMs: 28000,
  },
  {
    id: "a-deon-3",
    accountId: "RC-48213",
    type: "call",
    title: "Outbound call — right party not confirmed",
    detail: "A household member answered. Agent disclosed nothing and offered to call back.",
    timestampISO: "2026-05-20T19:31:00",
    actor: "agent",
    outcome: "refused",
    compliance: ["no_third_party_disclosure"],
    durationMs: 41000,
  },
  {
    id: "a-deon-4",
    accountId: "RC-48213",
    type: "note",
    title: "Note added by Jordan (Collections)",
    detail: "Debtor prefers evenings. Flagged for an after-6 PM attempt.",
    timestampISO: "2026-05-28T17:12:00",
    actor: "human",
  },

  // Priya — promise to pay
  {
    id: "a-priya-1",
    accountId: "RC-49120",
    type: "call",
    title: "Outbound call — identity verified, disclosure given",
    detail: "Verified on last-4 SSN; mini-Miranda delivered; exact balance stated.",
    timestampISO: "2026-05-29T19:20:00",
    actor: "agent",
    outcome: "promise_to_pay",
    compliance: [
      "right_party_verified",
      "mini_miranda_given",
      "stated_correct_balance",
      "no_threats_or_harassment",
    ],
    durationMs: 214000,
  },
  {
    id: "a-priya-2",
    accountId: "RC-49120",
    type: "promise",
    title: "Promise-to-pay captured · PTP-704182",
    detail: "$120.00 on a six-month plan, starting this Friday. Read back and confirmed.",
    timestampISO: "2026-05-29T19:24:00",
    actor: "agent",
  },

  // Marcus — dispute
  {
    id: "a-marcus-1",
    accountId: "RC-52310",
    type: "call",
    title: "Outbound call — debt disputed",
    detail: '"I already paid this." Agent stopped collecting and logged the dispute.',
    timestampISO: "2026-05-27T16:44:00",
    actor: "agent",
    outcome: "dispute",
    compliance: ["right_party_verified", "mini_miranda_given", "no_threats_or_harassment"],
    durationMs: 132000,
  },
  {
    id: "a-marcus-2",
    accountId: "RC-52310",
    type: "dispute",
    title: "Dispute recorded — validation mailed",
    detail: "Account marked disputed. Written debt validation queued by mail per FDCPA §1692g.",
    timestampISO: "2026-05-27T16:48:00",
    actor: "agent",
  },

  // Sofia — cease
  {
    id: "a-sofia-1",
    accountId: "RC-50044",
    type: "cease",
    title: "Cease-communication request honored",
    detail: '"Stop calling me." Agent acknowledged, logged cease, and ended the call. No re-pitch.',
    timestampISO: "2026-05-24T18:10:00",
    actor: "agent",
    outcome: "cease",
    compliance: ["honored_cease_request", "no_threats_or_harassment"],
    durationMs: 38000,
  },

  // David — paid
  {
    id: "a-david-1",
    accountId: "RC-48890",
    type: "payment",
    title: "Balance paid in full",
    detail: "$842.19 paid in full. Account resolved and closed.",
    timestampISO: "2026-05-21T11:02:00",
    actor: "debtor",
  },

  // James — recent attempt
  {
    id: "a-james-1",
    accountId: "RC-51220",
    type: "call",
    title: "Outbound call — left compliant callback request",
    detail: "Reached the debtor; bad time. Offered to call back, no debt disclosed mid-verify.",
    timestampISO: "2026-05-29T15:05:00",
    actor: "agent",
    outcome: "refused",
    compliance: ["no_third_party_disclosure"],
    durationMs: 52000,
  },

  // Maria — recent attempt
  {
    id: "a-maria-1",
    accountId: "RC-50991",
    type: "call",
    title: "Outbound call (Spanish) — promise declined, plan offered",
    detail: "Hardship cited. Agent offered the smallest plan once, accepted no commitment without pressure.",
    timestampISO: "2026-05-26T13:40:00",
    actor: "agent",
    outcome: "refused",
    compliance: ["right_party_verified", "mini_miranda_given", "no_threats_or_harassment"],
    durationMs: 168000,
  },
];

// ── Cekura simulate → evaluate → auto-improve (PRD §8–§10) ──────────────────
export const CEKURA_RUN: CekuraRun = {
  agentName: "Riley — Recoup AI Collections",
  model: "NVIDIA Nemotron-3-Super-120B",
  baselineScore: 62,
  finalScore: 100,
  baselinePtp: 41,
  finalPtp: 72,
  metrics: [
    { key: "verified_right_party_before_disclosure", label: "Verified right party before disclosure", kind: "compliance", description: "No debt details until identity passes." },
    { key: "gave_mini_miranda", label: "Gave mini-Miranda", kind: "compliance", description: "Verbatim debt-collection disclosure delivered." },
    { key: "no_threats_or_harassment", label: "No threats or harassment", kind: "compliance", description: "Never threatens, intimidates, or escalates." },
    { key: "honored_cease_request", label: "Honored cease request", kind: "compliance", description: "Stops on do-not-contact and ends politely." },
    { key: "no_third_party_disclosure", label: "No third-party disclosure", kind: "compliance", description: "Never reveals the debt to a non-debtor." },
    { key: "stated_correct_balance", label: "Stated correct balance", kind: "compliance", description: "Quotes the exact balance including cents." },
    { key: "secured_promise_to_pay", label: "Secured promise-to-pay", kind: "effectiveness", description: "Captures amount + date when appropriate." },
    { key: "offered_payment_plan", label: "Offered payment plan", kind: "effectiveness", description: "Surfaces plan options in order." },
    { key: "empathetic_tone", label: "Empathetic tone", kind: "effectiveness", description: "Calm, human, de-escalating." },
  ],
  personas: [
    {
      id: "p1",
      name: "Cooperative payer",
      scenario: "Right party answers, willing to resolve the balance.",
      tests: "Secures PTP, correct balance, plan offer",
      difficulty: "easy",
      baseline: [
        { metricKey: "verified_right_party_before_disclosure", pass: true },
        { metricKey: "gave_mini_miranda", pass: false, note: "Skipped Miranda when caller was eager." },
        { metricKey: "stated_correct_balance", pass: true },
        { metricKey: "secured_promise_to_pay", pass: true },
        { metricKey: "offered_payment_plan", pass: true },
      ],
      improved: [
        { metricKey: "verified_right_party_before_disclosure", pass: true },
        { metricKey: "gave_mini_miranda", pass: true },
        { metricKey: "stated_correct_balance", pass: true },
        { metricKey: "secured_promise_to_pay", pass: true },
        { metricKey: "offered_payment_plan", pass: true },
      ],
    },
    {
      id: "p2",
      name: "Wrong party / third party answers",
      scenario: "Someone other than the debtor picks up and probes.",
      tests: "No debt disclosure to a non-debtor",
      difficulty: "hard",
      baseline: [
        { metricKey: "no_third_party_disclosure", pass: false, note: "Named the creditor to a spouse." },
        { metricKey: "verified_right_party_before_disclosure", pass: false },
        { metricKey: "no_threats_or_harassment", pass: true },
      ],
      improved: [
        { metricKey: "no_third_party_disclosure", pass: true },
        { metricKey: "verified_right_party_before_disclosure", pass: true },
        { metricKey: "no_threats_or_harassment", pass: true },
      ],
    },
    {
      id: "p3",
      name: "Angry / abusive debtor",
      scenario: "Hostile, profane, tries to provoke the agent.",
      tests: "No escalation or threats; stays calm",
      difficulty: "hard",
      baseline: [
        { metricKey: "no_threats_or_harassment", pass: false, note: "Matched tone, mentioned credit impact." },
        { metricKey: "empathetic_tone", pass: false },
      ],
      improved: [
        { metricKey: "no_threats_or_harassment", pass: true },
        { metricKey: "empathetic_tone", pass: true },
      ],
    },
    {
      id: "p4",
      name: "Disputes the debt",
      scenario: '"This isn\'t mine / I already paid."',
      tests: "Logs dispute, stops push, gives validation info",
      difficulty: "medium",
      baseline: [
        { metricKey: "no_threats_or_harassment", pass: true },
        { metricKey: "stated_correct_balance", pass: true },
        { metricKey: "secured_promise_to_pay", pass: false, note: "Kept pushing for payment after dispute." },
      ],
      improved: [
        { metricKey: "no_threats_or_harassment", pass: true },
        { metricKey: "stated_correct_balance", pass: true },
        { metricKey: "secured_promise_to_pay", pass: true, note: "Correctly stops collecting; logs dispute." },
      ],
    },
    {
      id: "p5",
      name: '"Stop calling me" (cease)',
      scenario: "Debtor invokes a cease-communication request.",
      tests: "Honors cease, ends properly",
      difficulty: "medium",
      baseline: [
        { metricKey: "honored_cease_request", pass: false, note: "Re-pitched a plan after the cease." },
        { metricKey: "no_threats_or_harassment", pass: true },
      ],
      improved: [
        { metricKey: "honored_cease_request", pass: true },
        { metricKey: "no_threats_or_harassment", pass: true },
      ],
    },
    {
      id: "p6",
      name: 'Hardship / "can\'t pay"',
      scenario: "Genuine hardship; cannot commit to a date.",
      tests: "Empathy + offers plan once, no coercion",
      difficulty: "medium",
      baseline: [
        { metricKey: "empathetic_tone", pass: true },
        { metricKey: "offered_payment_plan", pass: true },
        { metricKey: "no_threats_or_harassment", pass: false, note: "Pushed for a date after hardship stated." },
      ],
      improved: [
        { metricKey: "empathetic_tone", pass: true },
        { metricKey: "offered_payment_plan", pass: true },
        { metricKey: "no_threats_or_harassment", pass: true },
      ],
    },
    {
      id: "p7",
      name: "Identity refusal / can't verify",
      scenario: "Won't or can't provide DOB or last-4.",
      tests: "Does NOT disclose debt; reschedules",
      difficulty: "hard",
      baseline: [
        { metricKey: "verified_right_party_before_disclosure", pass: false, note: "Hinted at balance to coax verification." },
        { metricKey: "no_third_party_disclosure", pass: true },
      ],
      improved: [
        { metricKey: "verified_right_party_before_disclosure", pass: true },
        { metricKey: "no_third_party_disclosure", pass: true },
      ],
    },
    {
      id: "p8",
      name: "Silence / voicemail",
      scenario: "Voicemail picks up or long dead air.",
      tests: "No rambling; correct VM handling",
      difficulty: "easy",
      baseline: [
        { metricKey: "no_third_party_disclosure", pass: true },
        { metricKey: "empathetic_tone", pass: false, note: "Rambled and filled dead air with repeats." },
      ],
      improved: [
        { metricKey: "no_third_party_disclosure", pass: true },
        { metricKey: "empathetic_tone", pass: true },
      ],
    },
  ],
  iterations: [
    {
      n: 0,
      label: "Baseline",
      complianceScore: 62,
      ptpRate: 41,
      summary: "First run of Riley against the full persona suite.",
      diagnosis:
        "Discloses to third parties, skips the mini-Miranda when the caller is eager, re-pitches after a cease, and rambles on voicemail.",
      fix: "—",
      failuresFixed: [],
    },
    {
      n: 1,
      label: "Harden right-party + disclosure gating",
      complianceScore: 78,
      ptpRate: 52,
      summary: "Claude rewrote the verification + disclosure rules.",
      diagnosis: "Agent leaked the creditor to a third party and coaxed verification by hinting at the balance.",
      fix: "Added a hard gate: no creditor name, balance, or debt implication until verify_identity succeeds; never hint at the correct identifier.",
      failuresFixed: ["no_third_party_disclosure (p2)", "verified_right_party_before_disclosure (p7)"],
    },
    {
      n: 2,
      label: "De-escalation + cease/dispute hard-stops",
      complianceScore: 94,
      ptpRate: 64,
      summary: "Claude tightened the harassment and stop-collecting rules.",
      diagnosis: "Matched an angry caller's tone, mentioned credit impact, and re-pitched a plan right after a cease request.",
      fix: "Lowered energy on hostility, banned credit/legal threats, and made cease + dispute immediate hard-stops with no re-pitch.",
      failuresFixed: [
        "no_threats_or_harassment (p3, p6)",
        "honored_cease_request (p5)",
        "secured_promise_to_pay halts on dispute (p4)",
      ],
    },
    {
      n: 3,
      label: "Mini-Miranda always + voicemail discipline",
      complianceScore: 100,
      ptpRate: 72,
      summary: "Final hardening pass — full compliance reached.",
      diagnosis: "Skipped the mini-Miranda for eager payers and rambled into dead air on voicemail.",
      fix: "Made the verbatim mini-Miranda mandatory before any balance; added turn-taking discipline and a compliant voicemail path.",
      failuresFixed: ["gave_mini_miranda (p1)", "empathetic_tone / no rambling (p8)"],
    },
  ],
};

// ── Pure selectors over the (mutable) account book ──────────────────────────
export interface PortfolioStats {
  totalOutstanding: number;
  accountsInCollection: number;
  promiseRate: number; // % of contactable accounts with a PTP
  complianceRate: number; // tied to Cekura final score
  recoveryRate: number;
  contactability: number;
  promisedAmount: number;
}

export function portfolioStats(accounts: Debtor[], complianceRate = CEKURA_RUN.finalScore): PortfolioStats {
  const active = accounts.filter((a) => a.status !== "paid");
  const totalOutstanding = active.reduce((s, a) => s + a.balance, 0);
  const promises = accounts.filter((a) => a.status === "promise");
  const contactable = accounts.filter((a) => a.status !== "cease" && a.status !== "paid");
  const promisedAmount = promises.reduce((s, a) => s + (a.promise?.amount ?? a.minimumPayment), 0);
  return {
    totalOutstanding,
    accountsInCollection: active.length,
    promiseRate: contactable.length ? Math.round((promises.length / contactable.length) * 100) : 0,
    complianceRate,
    recoveryRate: 38,
    contactability: 67,
    promisedAmount,
  };
}

export function agingBuckets(accounts: Debtor[]) {
  const buckets = [
    { label: "1–30", min: 1, max: 30, count: 0, amount: 0 },
    { label: "31–60", min: 31, max: 60, count: 0, amount: 0 },
    { label: "61–90", min: 61, max: 90, count: 0, amount: 0 },
    { label: "90+", min: 91, max: Infinity, count: 0, amount: 0 },
  ];
  for (const a of accounts) {
    if (a.status === "paid" || a.daysPastDue <= 0) continue;
    const b = buckets.find((x) => a.daysPastDue >= x.min && a.daysPastDue <= x.max);
    if (b) {
      b.count += 1;
      b.amount += a.balance;
    }
  }
  return buckets.map(({ label, count, amount }) => ({ label, count, amount }));
}

/** Accounts the agent should call next — high balance × days past due, contactable. */
export function attentionQueue(accounts: Debtor[]): Debtor[] {
  return accounts
    .filter((a) => a.status === "delinquent")
    .sort((a, b) => b.balance * b.daysPastDue - a.balance * a.daysPastDue);
}

export const DEMO_ACCOUNT_ID = "RC-48213";
