// ── Call engine ─────────────────────────────────────────────────────────────
// Produces a high-fidelity, time-stamped transcript for the live call console,
// scripted from Riley's actual compliant flow (server/bot-nemotron.py). When
// real Twilio + Pipecat env is configured, /api/calls places a real outbound
// call instead; this drives the always-works demo + the on-screen playback.

import { moneySpoken, money } from "./format";
import type { CallOutcome, ComplianceKey, Debtor, TranscriptTurn } from "./types";

export interface CallScenario {
  id: string;
  label: string;
  outcome: CallOutcome;
  turns: TranscriptTurn[];
  result?: { promise?: { amount: number; date: string; planId?: string | null } };
  /** Compliance keys that should be satisfied by call end. */
  expectedCompliance: ComplianceKey[];
}

let turnSeq = 0;
function turn(t: Omit<TranscriptTurn, "id">): TranscriptTurn {
  turnSeq += 1;
  return { id: `t-${turnSeq}`, ...t };
}

/** Cooperative debtor → ends in a six-month promise-to-pay. The headline demo. */
export function cooperativeScenario(d: Debtor): CallScenario {
  const first = d.name.split(" ")[0];
  const monthly = Math.round((d.balance / 6) * 100) / 100;
  const turns: TranscriptTurn[] = [
    turn({ role: "system", text: `Dialing ${first} • ${d.phone}`, at: 0 }),
    turn({ role: "agent", at: 700, step: "greet", text: `Hi, good evening — am I speaking with ${first}?` }),
    turn({ role: "debtor", at: 3100, text: `Uh, yeah, this is ${first}. Who's this?` }),
    turn({
      role: "agent",
      at: 5100,
      step: "verify",
      text: "Thanks. Before I can share anything, I just need to confirm I'm speaking with the right person — can you give me your date of birth, or the last four of your social?",
    }),
    turn({ role: "debtor", at: 9200, text: `Sure… last four are ${d.identityMask.ssnLast4.slice(-4)}.` }),
    turn({
      role: "agent",
      at: 11200,
      step: "verify",
      tool: "verify_identity",
      fires: ["right_party_verified", "no_third_party_disclosure"],
      text: `Perfect, thank you, ${first}.`,
    }),
    turn({
      role: "agent",
      at: 13600,
      step: "miranda",
      tool: "give_required_disclosure",
      fires: ["mini_miranda_given"],
      text: "This is an attempt to collect a debt, and any information obtained will be used for that purpose. This call may be recorded.",
    }),
    turn({
      role: "agent",
      at: 19200,
      step: "disclose",
      tool: "get_account_details",
      fires: ["stated_correct_balance"],
      text: `I'm calling about your ${d.originalCreditor} account. The current balance is ${moneySpoken(d.balance)}.`,
    }),
    turn({ role: "debtor", at: 24200, text: "Okay… that's honestly more than I can do right now." }),
    turn({
      role: "agent",
      at: 26200,
      step: "negotiate",
      fires: ["no_threats_or_harassment"],
      text: "I understand, and that's completely okay. Are you able to take care of the full balance today?",
    }),
    turn({ role: "debtor", at: 29400, text: "No, not the whole thing." }),
    turn({
      role: "agent",
      at: 31200,
      step: "negotiate",
      tool: "get_payment_options",
      text: "No problem at all. We can split it into three or six monthly payments — would either of those help?",
    }),
    turn({ role: "debtor", at: 35200, text: "The six-month one could work, I think." }),
    turn({
      role: "agent",
      at: 37200,
      step: "ptp",
      text: `Great — that comes to about ${money(monthly)} a month. Could you make the first payment this Friday?`,
    }),
    turn({ role: "debtor", at: 41200, text: "Yeah, Friday works." }),
    turn({
      role: "agent",
      at: 43200,
      step: "ptp",
      tool: "log_promise_to_pay",
      text: `Thank you. I've set up a promise to pay ${money(monthly)} this Friday on a six-month plan. You'll get a confirmation by text.`,
    }),
    turn({ role: "agent", at: 48000, step: "wrapup", text: "Is there anything else I can help you with?" }),
    turn({ role: "debtor", at: 50200, text: "No, that's everything." }),
    turn({
      role: "agent",
      at: 51800,
      step: "wrapup",
      tool: "end_call",
      fires: ["no_threats_or_harassment", "no_third_party_disclosure"],
      text: `You're all set, ${first}. Thanks for your time — take care. Goodbye.`,
    }),
    turn({ role: "system", text: "Call ended • duration 0:54 • outcome: promise-to-pay", at: 54200 }),
  ];
  return {
    id: "cooperative",
    label: "Cooperative payer",
    outcome: "promise_to_pay",
    turns,
    result: { promise: { amount: monthly, date: "this Friday", planId: "plan_6mo" } },
    expectedCompliance: [
      "right_party_verified",
      "mini_miranda_given",
      "stated_correct_balance",
      "no_threats_or_harassment",
      "no_third_party_disclosure",
    ],
  };
}

/** Default scenario selector — cooperative for the live demo. */
export function scenarioFor(d: Debtor): CallScenario {
  turnSeq = 0;
  return cooperativeScenario(d);
}

export const TYPE_SPEED_MS = 18; // per-character reveal for the streaming transcript
