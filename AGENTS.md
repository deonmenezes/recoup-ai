# Recoup AI

Self-improving, FDCPA-compliant AI voice agents for debt collection, paired with a Salesforce-style CRM dashboard. Built for the YC Voice Agents Hackathon. A live Pipecat agent ("Riley") calls real phone numbers via Twilio and runs fully compliant collections calls.

## Tech Stack

- **Voice agent (`server/`):** Python 3.11+, Pipecat (NVIDIA Nemotron ASR/LLM, Magpie/Gradium TTS), Twilio, Pipecat Cloud, uv
- **CRM frontend (`web/`):** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React
- **Eval/QA:** Cekura (simulated-caller compliance grading)
- **Deployment:** Vercel (web), Pipecat Cloud (voice agent), Docker (server)

## Setup

### Voice agent (server)
```bash
cd server
pip install uv
uv sync          # installs from pyproject.toml / uv.lock
```

### CRM web frontend (web)
```bash
cd web
npm install
```

Environment variables required (not committed): Twilio credentials, NVIDIA API key, Pipecat Cloud credentials, Cekura API key.

## Build / Run / Test

### Voice agent
```bash
cd server
# Run the Nemotron bot locally
uv run python bot-nemotron.py

# Run the mock backend for testing
uv run python mock_backend.py

# Run tests
uv run pytest
```

### CRM web frontend
```bash
cd web
npm run dev      # local dev server
npm run build    # production build
npm run start    # start production server
```

## Project Structure

```
server/
  bot-nemotron.py       Main Pipecat voice agent (NVIDIA Nemotron)
  bot-gpt.py            GPT-backed alternative bot
  nemotron_llm.py       NVIDIA Nemotron LLM integration
  nvidia_stt.py         NVIDIA speech-to-text
  mock_backend.py       Mock backend for local testing
  pyproject.toml        Python deps (uv)
  pcc-deploy.toml       Pipecat Cloud deployment config
  Dockerfile            Container build for cloud deploy

web/
  src/                  Next.js app source
  public/               Static assets
  next.config.ts        Next.js config
  package.json          npm scripts + deps

demo/                   Demo video
docs/                   Screenshots and documentation
dashboard.html          Static dashboard preview
```

## Architecture & Key Files

- `server/bot-nemotron.py` — the primary Pipecat pipeline: receives Twilio webhook, runs ASR → LLM (Nemotron) → TTS, enforces FDCPA compliance in the system prompt.
- `server/pcc-deploy.toml` — Pipecat Cloud deployment configuration for the live agent.
- `web/src/` — Next.js CRM: displays call logs, debtor records, compliance scores, and self-improvement feedback loop from Cekura evals.
- The self-improvement loop: Cekura grades each call for FDCPA compliance → failures fed back into the agent prompt → repeat until 100% compliance.

## Conventions & Notes for Agents

- **Secrets are never committed.** All credentials (Twilio, NVIDIA, Pipecat Cloud, Cekura) must be supplied via environment variables.
- The voice agent (`server/`) and CRM (`web/`) are independent deployments — changes to one do not require rebuilding the other.
- Python environment is managed with `uv`; do not use `pip install` directly — use `uv add` to add dependencies.
- FDCPA compliance is enforced via the LLM system prompt in `bot-nemotron.py`; changes to that prompt require re-evaluation with Cekura.
- `dashboard.html` is a standalone static file (not part of the Next.js app) used for demo purposes.
