// Claude clean-energy advisor. Given grounded property signals, asks Claude for
// a ranked, honest clean-energy plan as structured JSON. Returns null when no
// ANTHROPIC_API_KEY is configured so the route can fall back to a local plan.

import Anthropic from "@anthropic-ai/sdk";
import type { CleanEnergyPlan, PropertySignals } from "./types";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `You are GridPath's clean-energy advisor. Given grounded data about ONE property, recommend the best concrete options to make its energy clean — ranked, honest, and specific to this property's numbers.

Rules:
- Use ONLY the provided signals. Do not invent utility rates, incentives, or production figures that contradict them. You may apply standard incentives (30% federal ITC, California SGIP/TECH rebates, 25C/30C credits).
- Every dollar figure must trace to the signals: cost from system size, savings from utilityRate × offset kWh, payback = cost ÷ annual savings, CO2 from gridCarbonKgPerKwh.
- Be specific to THIS roof and bill — reference the actual panel count, kWh, and dollar amounts.
- Recommend the options that genuinely fit (rooftop solar, home battery, heat pump, EV charger). Mark the highest-impact ones as recommended, ordered by priority (1 = do first).
- estimatedCost is AFTER incentives. paybackYears and co2ReductionTons are per year where applicable.
- Keep prose tight and plain. No hype. Numbers carry the argument.`;

// JSON Schema for the structured plan. No numeric range constraints (unsupported);
// every object sets additionalProperties:false.
const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    cleanScoreBefore: { type: "integer" },
    cleanScoreAfter: { type: "integer" },
    options: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          icon: { type: "string" },
          recommended: { type: "boolean" },
          headline: { type: "string" },
          whatItIs: { type: "string" },
          estimatedCost: { type: "number" },
          annualSavings: { type: "number" },
          paybackYears: { type: "number" },
          co2ReductionTons: { type: "number" },
          incentives: { type: "array", items: { type: "string" } },
          priority: { type: "integer" },
        },
        required: [
          "key", "name", "icon", "recommended", "headline", "whatItIs",
          "estimatedCost", "annualSavings", "paybackYears", "co2ReductionTons",
          "incentives", "priority",
        ],
      },
    },
    recommendedBundle: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: { type: "array", items: { type: "string" } },
        totalCost: { type: "number" },
        totalAnnualSavings: { type: "number" },
        note: { type: "string" },
      },
      required: ["items", "totalCost", "totalAnnualSavings", "note"],
    },
  },
  required: [
    "headline", "summary", "cleanScoreBefore", "cleanScoreAfter",
    "options", "recommendedBundle",
  ],
} as const;

export async function recommendWithClaude(
  signals: PropertySignals
): Promise<CleanEnergyPlan | null> {
  if (!hasClaude()) return null;

  const client = new Anthropic();
  const prompt = `Property signals (JSON):\n${JSON.stringify(signals, null, 2)}\n\nProduce the clean-energy plan for this property as JSON matching the schema.`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      // Structured output + modest effort for snappy responses.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: PLAN_SCHEMA },
      },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as Omit<CleanEnergyPlan, "source" | "signals">;
    return { ...parsed, source: "claude", signals };
  } catch (err) {
    console.error("Claude recommendation failed; using fallback.", err);
    return null;
  }
}
