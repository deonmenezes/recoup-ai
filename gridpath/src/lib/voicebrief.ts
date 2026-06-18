// Voice brief: turns a GridPath estimate (+ optional clean-energy plan) into a
// short, spoken briefing for an outbound phone call. Claude writes a natural,
// conversational script when ANTHROPIC_API_KEY is set; otherwise a deterministic
// template is used so the call always works.

import Anthropic from "@anthropic-ai/sdk";
import type { CleanEnergyPlan, ConnectionEstimate } from "./types";
import { formatUsd } from "./cost";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

/** Short place name from a long geocoder label: "Snowden, ... WV" -> "Snowden". */
function shortPlace(label: string): string {
  return label.split(",")[0]?.trim() || label;
}

function topRecommendation(plan: CleanEnergyPlan | null): string | null {
  if (!plan) return null;
  const rec =
    plan.options.find((o) => o.recommended) ??
    [...plan.options].sort((a, b) => a.priority - b.priority)[0];
  if (!rec) return null;
  return `${rec.name}: ${rec.headline}. Estimated ${formatUsd(
    rec.estimatedCost
  )} after incentives, saving about ${formatUsd(
    rec.annualSavings
  )} a year, paying for itself in roughly ${Math.round(rec.paybackYears)} years.`;
}

/** Plain facts the brief must cover — also fed to Claude as grounding. */
export function briefFacts(
  estimate: ConnectionEstimate,
  plan: CleanEnergyPlan | null
): string {
  const place = shortPlace(estimate.address);
  const miles = (estimate.distanceFeet / 5280).toFixed(2);
  const conn =
    estimate.nearestGridPoint.type === "substation"
      ? "substation"
      : estimate.nearestGridPoint.type === "transformer"
      ? "transformer"
      : estimate.nearestGridPoint.type === "pole"
      ? "power pole"
      : "power line";
  const lines = [
    `Location: ${place} (${estimate.address}).`,
    `Distance to the nearest grid connection (${conn}): ${estimate.distanceFeet} feet, about ${miles} miles.`,
    `Connection type: ${estimate.mode}.`,
    `Estimated connection cost: ${formatUsd(estimate.estimatedCost.total)}.`,
    `Estimated timeline: ${estimate.estimatedTimeline.label}, ${estimate.estimatedTimeline.applicationNote}.`,
    `Transformer required: ${estimate.needsTransformer ? "yes" : "no"}.`,
    `How it was calculated: ${estimate.explanation}`,
  ];
  const rec = topRecommendation(plan);
  if (rec) lines.push(`Top clean-energy recommendation — ${rec}`);
  if (plan)
    lines.push(
      `Clean score would go from ${plan.cleanScoreBefore} to ${plan.cleanScoreAfter} out of 100.`
    );
  return lines.join("\n");
}

/** Deterministic spoken script — always available, no API key needed. */
export function fallbackBrief(
  estimate: ConnectionEstimate,
  plan: CleanEnergyPlan | null
): string {
  const place = shortPlace(estimate.address);
  const miles = (estimate.distanceFeet / 5280).toFixed(2);
  const parts = [
    `Hi! This is GridPath calling with your grid connection briefing for ${place}.`,
    `Here's what we found. The nearest grid connection is about ${estimate.distanceFeet} feet away, roughly ${miles} miles, using a ${estimate.mode} connection.`,
    `The estimated cost to connect is ${formatUsd(estimate.estimatedCost.total)}, ` +
      `and the estimated timeline is ${estimate.estimatedTimeline.label}, ${estimate.estimatedTimeline.applicationNote}.`,
    estimate.needsTransformer
      ? `This site will need a transformer, which is included in that estimate.`
      : `Good news — no transformer is required for this site.`,
  ];
  const rec = topRecommendation(plan);
  if (rec) {
    parts.push(`On the clean-energy side, our top recommendation is ${rec}`);
  }
  parts.push(
    `You can review the full breakdown and start an application on the GridPath website. Thanks for using GridPath, and have a great day!`
  );
  return parts.join(" ");
}

/** Ask Claude to write a warmer, natural ~45-second script. Null if no key/error. */
export async function claudeBrief(
  estimate: ConnectionEstimate,
  plan: CleanEnergyPlan | null
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();
  const system = `You are Riley, GridPath's friendly clean-energy connection advisor, leaving a short spoken briefing on a phone call. Write ONLY the words to be spoken aloud — no stage directions, no markdown, no bullet points, no numbered lists. Keep it to roughly 45 to 60 seconds when read aloud (about 110-150 words). Be warm, clear, and concrete. Open by saying this is GridPath calling about their selected location. Cover: distance to the grid, the estimated connection cost, the timeline, and the single best clean-energy recommendation with its payback. Close warmly and mention they can see the full breakdown on the website. Speak numbers naturally (say "twelve thousand dollars", not "$12,000"). Do not invent figures beyond the facts given.`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages: [
        {
          role: "user",
          content: `Facts about the caller's selected location:\n\n${briefFacts(
            estimate,
            plan
          )}\n\nWrite the spoken briefing.`,
        },
      ],
    });
    const text = res.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text.trim() : null;
  } catch (err) {
    console.error("Claude voice brief failed; using template.", err);
    return null;
  }
}

/** Escape a string for safe inclusion inside TwiML XML. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wrap spoken text in TwiML the Twilio Calls API can play inline. */
export function toTwiml(script: string, voice = "Polly.Joanna-Neural"): string {
  // Split on sentence boundaries so we can add small pauses for natural pacing.
  const chunks = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const say = chunks
    .map(
      (c) =>
        `<Say voice="${voice}">${escapeXml(c)}</Say><Pause length="0"/>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="1"/>${say}</Response>`;
}

export const VOICE = "Polly.Joanna-Neural";

/** Base64url encode/decode for stuffing context into webhook query strings. */
export function encodeCtx(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}
export function decodeCtx<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** A `<Say>` (optional) followed by a speech `<Gather>` that posts to `action`. */
export function gatherTwiml(action: string, prompt?: string): string {
  const say = prompt
    ? `<Say voice="${VOICE}">${escapeXml(prompt)}</Say>`
    : "";
  // speechTimeout="auto" ends capture on natural pause; bargeIn lets the caller
  // interrupt. If nothing is said, repeat with a nudge then hang up gracefully.
  return (
    `<?xml version="1.0" encoding="UTF-8"?><Response>` +
    `<Gather input="speech" speechTimeout="auto" speechModel="phone_call" ` +
    `action="${escapeXml(action)}" method="POST">${say}</Gather>` +
    `<Say voice="${VOICE}">I didn't hear anything. You can call back anytime for more on this location. Goodbye!</Say>` +
    `<Hangup/></Response>`
  );
}

/** Final spoken line + hang up. */
export function hangupTwiml(line: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><Response>` +
    `<Say voice="${VOICE}">${escapeXml(line)}</Say><Hangup/></Response>`
  );
}

/** True when the caller is clearly ending the call. */
export function isGoodbye(text: string): boolean {
  return /\b(good\s?bye|bye|that'?s all|no(thing)?( else)?( thanks)?|i'?m done|hang up|thank you,? bye)\b/i.test(
    text.trim()
  );
}
