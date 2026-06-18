// Distance-bucket timeline model (PRD §7.5).
//
// | Condition                                      | Timeline    |
// | Within ~150 ft of existing pole/transformer    | 4–6 weeks   |
// | 150–500 ft, line extension needed              | 6–12 weeks  |
// | > 500 ft or new transformer required           | 3–6 months  |
//
// The flat "+2 weeks application/review" is surfaced as a separate note so the
// headline bucket stays clean (matching the reference design).

import type { EstimatedTimeline } from "./types";

const APPLICATION_NOTE = "+2 weeks application & review";

export function computeTimeline(
  distanceFeet: number,
  needsTransformer: boolean
): EstimatedTimeline {
  if (distanceFeet > 500 || needsTransformer) {
    return { min: 3, max: 6, unit: "months", label: "3–6 months", applicationNote: APPLICATION_NOTE };
  }
  if (distanceFeet > 150) {
    return { min: 6, max: 12, unit: "weeks", label: "6–12 weeks", applicationNote: APPLICATION_NOTE };
  }
  return { min: 4, max: 6, unit: "weeks", label: "4–6 weeks", applicationNote: APPLICATION_NOTE };
}
