# Recoup AI — Collections CRM

A Salesforce-Lightning-style **debt-collection CRM** for compliant AI voice agents. It's the
operator cockpit on top of the [Recoup AI](../PRD.md) voice agent (Pipecat + NVIDIA Nemotron),
graded continuously by **Cekura**.

> Ring outstanding debts with one click, watch **FDCPA compliance light up in real time** during
> the call, capture promises-to-pay, and prove the agent auto-improves from **62% → 100%** compliance.

## ✨ What's inside

- **Dashboard** — portfolio KPIs (outstanding, promise-to-pay rate, recovery, **100% compliance**),
  aging breakdown, an "accounts to call next" queue, and a live activity feed.
- **Accounts list** — a sortable, filterable book of debtors with status & risk pills and inline call buttons.
- **Account record page** — record header, action bar (**Call now**, log promise-to-pay, mark disputed,
  honor cease), tabbed **Activity / Details / Script / Compliance**, and a right **side-panel** with the
  full customer context and "what happened" history.
- **Call console** — dial → ring → connected, a streaming transcript, a **live FDCPA compliance checklist**,
  a script-step tracker, and automatic outcome capture written back to the timeline.
- **Compliance Lab** — Cekura's *simulate → evaluate → auto-improve* loop: 8 adversarial personas,
  the compliance-score climb, and Claude's per-iteration prompt fixes.

## 🛠 Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · framer-motion · lucide-react.
Zero runtime backend required — state is a client store persisted to `localStorage`. Deployed on Vercel.

## ▶️ Run locally

```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

The CRM is a fully self-contained demo with **no env vars**. To wire the *real* outbound call
(Twilio → Pipecat) and live Cekura mode, copy `.env.example` → `.env.local` and fill it in.

## 📡 Optional: real telephony

`POST /api/calls { accountId }` places a real outbound Twilio call connected to the deployed
Pipecat bot when `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` are set;
otherwise it returns `{ mode: "simulation" }` and the on-screen scripted call still runs.

## 🚀 Deploy

Deployed on Vercel with the project **Root Directory** set to `web/`. Framework preset: Next.js.
Add the optional env vars in the Vercel dashboard to enable live telephony / Cekura.

## 🧭 Structure

```
web/src
├── app/                 # routes: / · /accounts · /accounts/[id] · /evaluations · /api/*
├── components/
│   ├── shell/           # nav rail, top bar, providers
│   ├── ui/              # design-system primitives (Button, Badge, Card, charts, …)
│   ├── dashboard/       # portfolio command center
│   ├── accounts-list/   # debtor book list view
│   ├── account-record/  # record page + side-panel
│   ├── call/            # live call console
│   └── cekura/          # Compliance Lab
└── lib/                 # types, seed data (mirrors server/mock_backend.py), store, formatters, call engine
```

Data mirrors the voice-agent workflow in [`../server`](../server): the same debtor accounts, the seven
agent tools, Riley's compliant script, and the Cekura compliance/effectiveness metrics.
