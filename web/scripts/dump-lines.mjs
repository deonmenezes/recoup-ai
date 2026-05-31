import { writeFileSync } from "node:fs";
import { SEED_DEBTORS } from "../src/lib/data.ts";
import { scenarioFor } from "../src/lib/callEngine.ts";

// FNV-1a 32-bit — MUST match hashText() in src/lib/speech.ts
function hashText(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return (h >>> 0).toString(36);
}

const out = [];
const seen = new Set();
for (const d of SEED_DEBTORS) {
  const sc = scenarioFor(d);
  for (const t of sc.turns) {
    if (t.role !== "agent") continue; // Riley only → NVIDIA Magpie
    const key = hashText(t.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, account: d.accountId, text: t.text });
  }
}
writeFileSync(new URL("./call-lines.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("unique agent lines:", out.length, "| accounts:", SEED_DEBTORS.length);
