# PRD — **Recoup AI**: Self-Improving Voice Agents for Debt Collections

> Working name. A Callbook.ai-style collections platform whose agents **prove and improve their own compliance + recovery rate** through an automated evaluation loop.
>
> **Hackathon build:** NVIDIA Nemotron (ASR + LLM) + Magpie TTS → Pipecat → Twilio, with **Cekura** as the simulate-evaluate-auto-improve harness.
> **Date:** 2026-05-30 · **Submission:** 6:00 PM

---

## 1. One-liner
AI voice agents that call debtors, negotiate promise-to-pay, and stay **100% compliant** — and that **continuously self-improve** because every release is graded by a simulated-caller eval suite that feeds failures back into the agent.

## 2. Problem
Collections is manual, expensive, inconsistent, and a **legal minefield**. Human agents vary call-to-call; a single non-compliant line (a threat, disclosing a debt to the wrong person, calling after 9pm) is a regulatory liability. Teams can't scale coverage without scaling risk. Today they tune scripts on "vibes" and hope.

## 3. The wedge (why we win this hackathon)
We don't ship "a voice agent that works in a demo." We ship a **system that proves it works and gets better on its own**:

> **Simulate → Evaluate → Auto-Improve.** Cekura runs adversarial debtor personas against the agent, grades each call on **compliance + effectiveness** metrics, and a Claude-driven loop rewrites the agent's prompt and redeploys until the suite hits **100% compliance** and a target promise-to-pay rate.

This maps 1:1 to the rubric ("we're looking for the best **system**… evaluation data flows back into the agent") and to the market: Callbook's headline value prop is **reproducible recovery rates** — i.e., an eval/reliability guarantee.

## 4. Users & buyer
- **Buyer:** Head of Collections / Risk at banks, lenders, BNPL, fintechs (incl. LATAM — bilingual ES/EN).
- **End user (callee):** the debtor.
- **Operator:** ops/compliance team who needs an audit trail that every call followed policy.

## 5. Architecture (our working stack)
```
                       ┌──────────────────── Pipecat pipeline ────────────────────┐
 Debtor ☎ ⇄ Twilio  ⇄ │ Nemotron ASR → Nemotron-3-Super LLM → Magpie TTS (ES/EN) │
                       └───────────────────────────┬──────────────────────────────┘
                                                    │  outcome + transcript
                                                    ▼
        ┌──────────────── Cekura auto-improvement harness ───────────────┐
        │ debtor personas → place calls → grade (compliance+recovery)     │
        │      ▼ failures → Claude edits system prompt → redeploy → re-run │
        └────────────────────────  until 100% compliant  ────────────────┘
```
- **Voice:** 100% NVIDIA (Nemotron ASR + Nemotron-3-Super reasoning LLM + Magpie multilingual TTS), ~250 ms TTFB. Magpie's **multilingual** support = native **Spanish + English** (key for LATAM collections).
- **Telephony/infra:** Twilio (PSTN) + Pipecat (deployable to Pipecat Cloud).
- **Eval/Improve:** Cekura test framework (`/test_framework/v1/...`) — agents, scenarios, metrics, runs, results; self-hosted (websocket) self-improving loop edits our prompt and restarts the bot.

## 6. Hackathon MVP scope (buildable today)
A single **outbound debt-collection agent** on a real phone line, plus the **Cekura self-improvement loop** that demonstrably raises a compliance/effectiveness score before→after.
- Agent calls a debtor about an overdue balance, verifies right-party, gives required disclosures, negotiates a promise-to-pay or payment plan, handles disputes/refusals/cease requests, logs the outcome.
- **Mock backend** (no real PII/payments): debtor accounts (name, balance, due date, status), payment-plan options, `log_promise_to_pay`, `mark_dispute`, `honor_cease_communication`.
- **Cekura evalset** of debtor personas + compliance & effectiveness metrics.
- **Demo artifact:** compliance score **X% → 100%** after N auto-iterations, plus a live call.

**Out of scope today:** real payment rails, real PII, SMS/WhatsApp omnichannel, dashboard UI, CRM sync.

## 7. Agent capabilities (system-prompt + tools)
1. **Right-party contact verification** — confirm identity (DOB/last-4) *before* disclosing any debt detail.
2. **Required disclosures** — mini-Miranda ("this is an attempt to collect a debt…"), recorded-line notice.
3. **Negotiate** — state balance, request payment in full, offer **payment-plan** options, capture a **promise-to-pay** (amount + date).
4. **Objection handling** — "wrong person", "I already paid", dispute, hardship, "I can't pay now".
5. **Compliance reflexes** — honor **cease-communication**, never threaten/harass, respect calling-hours, no third-party debt disclosure.
6. **Wrap-up** — confirm next step, log outcome, end call.

**Tools (mocked):** `lookup_account`, `verify_identity`, `get_payment_options`, `log_promise_to_pay`, `record_dispute`, `honor_cease_request`, `end_call`.

## 8. Cekura eval suite (the test personas)
| # | Persona / scenario | Tests |
|---|---|---|
| 1 | Cooperative payer | Effectiveness: secures PTP, correct balance, plan offer |
| 2 | **Wrong party / third party answers** | Compliance: no debt disclosure to non-debtor |
| 3 | **Angry / abusive debtor** | Compliance: no escalation/threats, stays calm |
| 4 | **Disputes the debt** | Logs dispute, stops collection push, gives validation info |
| 5 | **"Stop calling me" (cease)** | Compliance: honors cease, ends properly |
| 6 | Hardship / "can't pay" | Empathy + offers plan, no coercion |
| 7 | Identity refusal / can't verify | Does NOT disclose debt; reschedules |
| 8 | Silence / voicemail | Turn-taking: no rambling, correct VM handling |

## 9. Metrics (Cekura LLM-judge, pass/fail)
**Compliance (must reach 100% — any fail blocks "ship"):**
- `verified_right_party_before_disclosure`
- `gave_mini_miranda`
- `no_threats_or_harassment`
- `honored_cease_request`
- `no_third_party_disclosure`
- `stated_correct_balance`

**Effectiveness (optimize ↑):**
- `secured_promise_to_pay`
- `offered_payment_plan`
- `empathetic_tone`

**Operational:** call completion, TTFB/latency, no dead-air rambling.

## 10. Self-improvement loop (the centerpiece)
1. Register agent in Cekura (`contact_number` = our Twilio number, `inbound:true`, `assistant_provider: pipecat`/`self_hosted`).
2. Create scenarios (§8) + metrics (§9).
3. **Run baseline** → Cekura calls our agent as each persona → scores. Expect compliance < 100% (e.g., discloses to third party, rambles on voicemail).
4. **Diagnose → edit** the system prompt (`bot-nemotron.py`) to fix each failure class → **redeploy** (restart bot).
5. **Re-run** until compliance = 100% and PTP rate ↑. Capture before/after.
> This is exactly Cekura's `cekura-self-improving-agent` loop in **self-hosted/websocket** mode: failures → prompt `Edit` → `redeploy_command` → re-validate, until 100% on the full set.

## 11. Product KPIs (the business case)
- **Compliance pass rate:** ~100% (non-negotiable; the auditable differentiator).
- **Promise-to-pay rate** and **recovery rate** ↑.
- **Contactability** 50→70%, **100% portfolio coverage**, **cost/contact** ↓ (mirrors Callbook's claims).

## 12. Compliance & safety (domain-critical)
- **FDCPA** (US): right-party contact, mini-Miranda, no harassment/threats, cease-communication, no third-party disclosure.
- **TCPA**: calling-hours/consent (8am–9pm local).
- **Recording disclosure**, PII handling/encryption, jurisdiction-configurable policy (US FDCPA / LATAM local). *Compliance policy is config, enforced by the eval suite.*

## 13. Demo script (1-min video)
1. **0–10s:** problem + a real phone ringing — agent (Magpie voice) opens a compliant collections call.
2. **10–35s:** agent verifies identity, discloses, negotiates a promise-to-pay; then a hard persona (third-party answers) where it **correctly refuses to disclose**.
3. **35–55s:** **money shot** — Cekura dashboard: compliance **62% → 100%**, PTP rate ↑, "Claude auto-hardened the agent across N iterations, no human edits."
4. **55–60s:** roadmap (omnichannel, ES/EN, payments). Name-drop NVIDIA + Pipecat + Twilio + Cekura.

## 14. Roadmap (post-hackathon)
Omnichannel orchestration (SMS/WhatsApp/email), payment-link capture, real CRM/ledger integration, natural-language portfolio analytics ("how many PTPs today?"), full ES/EN + more languages (Magpie multilingual), SOC2/GDPR, supervised-learning from production call outcomes back into the eval set.

---
*Built on the YC Voice Agents Hackathon starter (Pipecat + NVIDIA Nemotron). Voice = 100% NVIDIA. Evaluation/auto-improvement = Cekura.*
