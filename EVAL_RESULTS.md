# Recoup AI — Self-Improvement Loop Results

**Agent:** Recoup AI, an outbound FDCPA-compliant debt-collections voice agent.
**Stack:** NVIDIA Nemotron ASR + Nemotron-3-Super LLM + Magpie TTS · Pipecat · Twilio · **Cekura** (eval + auto-improve).

## The loop
1. Authored **7 FDCPA judge-metrics** + **6 adversarial debtor personas** in Cekura (Cekura agent `18100`, project `5943`).
2. **Baseline run** (`592074`) — Cekura auto-called the agent as each persona and scored compliance.
3. Claude read the failures → **hardened the agent**: rewrote the system prompt and added **code-level compliance gates** (mini-Miranda enforced in code; dispute/cease set a `collection_stopped` flag that hard-stops every collection tool; no-assert greeting; verification retry cap; settlement gated).
4. **Re-ran** (`592125`) — compliance jumped.

## Before → After
| Metric | Before (`592074`) | After (`592125`) |
|---|---|---|
| Fully-compliant scenarios | 1/6 (17%) | 2/4 (50%) |
| `right_party_before_disclosure` | 1/6 (17%) | **3/4 (75%)** |
| `honored_cease_request` | 0/1 (0%) | **1/1 (100%)** |
| `secured_promise_to_pay` | 1/3 | 1/1 |
| `gave_mini_miranda` | 4/4 | 2/2 |
| `no_threats_or_harassment` | 5/5 | 3/3 |
| `empathetic_professional_tone` | 6/6 | 4/4 |

**Headline:** the dominant baseline violation — the agent naming the creditor *before* verifying identity (`right_party_before_disclosure`) — improved **17% → 75%**, and cease-request handling **0% → 100%**, purely from evaluation data flowing back into the agent.

*Note: the after-run scored 4/6 runs because 2 of its calls collided with a concurrent live demo call; per-metric rates above are over the comparably-evaluated runs.*

## What the hardening changed (code-enforced, not just prompted)
- `get_account_details` refuses until **both** `verify_identity` **and** `give_required_disclosure` (mini-Miranda) have fired.
- `record_dispute` / `honor_cease_request` set `collection_stopped` → `get_account_details`, `get_payment_options`, `log_promise_to_pay` all refuse afterward (hard stop).
- Greeting no longer asserts the right party answered; creditor name withheld until verification.
- Settlement option removed from the default offer set (manager-approved only).

## Links
- Baseline: https://dashboard.cekura.ai/5943/results/592074
- After: https://dashboard.cekura.ai/5943/results/592125
- Code: `server/bot-nemotron.py` · `server/mock_backend.py` · PRD: `PRD.md`
