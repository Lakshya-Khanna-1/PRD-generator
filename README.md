# SpecForge

Turn a raw app idea into a downloadable zip of agent-ready spec documents — `spec.md`, `tasks.md`, and `agents.md` — ready to drop straight into Cursor, Claude Code, Codex, or any other AI coding agent.

Most people get mediocre results from AI coding agents because they hand them a vague idea instead of a real spec. SpecForge closes that gap: describe your idea, answer a few targeted clarifying questions, and watch a complete, project-specific spec set get written live.

## How it works

1. **Describe your idea** — one textarea, as vague or detailed as you like.
2. **Answer a few questions** — 4-6 targeted questions about users, platform, auth, and monetization. Skip anything and SpecForge decides for you.
3. **Watch it generate** — a brief → `spec.md` → `tasks.md` → `agents.md` pipeline runs live, streamed to the screen.
4. **Review & download** — a tabbed viewer for all three docs, with copy, regenerate-this-doc, and download-zip actions.

Try `/example` on a running instance to see a real generated doc set without running the pipeline yourself.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **OpenRouter** for all LLM calls, behind a single wrapper (`lib/llm.ts`) with automatic fallback-model retry
- **Zod** for schema validation of LLM JSON output
- **react-markdown** + **remark-gfm** for rendering generated docs
- **JSZip** for building the downloadable zip
- **Sentry** (`@sentry/nextjs`) for error tracking — fully optional, no-op unless a DSN is configured

The browser never touches the LLM API key — every OpenRouter call happens server-side, behind API routes.

## Getting started

**Windows:** double-click `Start-SpecForge.bat` — it installs dependencies, checks your environment setup, and opens the app in your browser automatically.

**Any OS:**

```bash
npm install
cp .env.example .env.local   # then fill in a real OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Full environment variable reference and Vercel deployment instructions are in [`SETUP.md`](./SETUP.md).

## Project structure

```
app/                    Next.js App Router pages & API routes
  api/generate/         clarify, pipeline (SSE), regenerate, zip
  create/                the idea -> clarify -> generate -> review flow
  example/, terms/, privacy/
components/
  ui/                    shared primitives (Button, Card, Tabs, Stepper, ...)
  landing/               landing page sections
  create/                the /create flow's step components
  docs/                  MarkdownDoc — shared renderer for generated content
lib/
  llm.ts                 the single OpenRouter wrapper (models, fallback, logging)
  brief.ts               raw idea + answers -> structured JSON brief
  docs/                  spec.md / tasks.md / agents.md generators
  rateLimit.ts            in-memory per-IP rate limiting
```

## Project docs

This repo was built milestone-by-milestone against its own internal spec — worth reading if you're picking up development:

- [`spec.md`](./spec.md) — full product specification
- [`tasks.md`](./tasks.md) — the milestone-by-milestone build plan (all 5 milestones complete)
- [`agents.md`](./agents.md) — operating rules used while building this (verification checklist, design bar, etc.)
- [`milestones.md`](./milestones.md) — checkpoint/acceptance criteria per milestone
- [`HANDOVER.md`](./HANDOVER.md) — current project status, what's been verified, known limitations, and deploy/regression checklists

**Current status:** code-complete through all 5 planned milestones. Payments/tiers/auth are deferred (the product currently runs as a single free, unlimited tier — see `spec.md` §6 and `HANDOVER.md` for why). Not yet deployed to production — see `SETUP.md` to deploy your own instance.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run lint` | ESLint |
