# HANDOVER.md — SpecForge

Snapshot of project state for whoever (human or agent) picks this up next. Read `agents.md`, `spec.md`, `tasks.md`, `milestones.md` first — this file only covers what those don't: current status, what's been verified, and what's blocking.

## Status: Milestone 3 of 5 complete (pending human review)

- [x] **Milestone 1 — Skeleton & LLM wrapper** (commit `8c0752d`)
- [x] **Milestone 2 — Full generation pipeline** (commit `6b661b2`)
- [x] **Milestone 3 — Real UI ("make the website look good")** — built and self-verified this session, **not yet committed** (see below)
- [ ] Milestone 4 — Tiers, limits & payments — not started
- [ ] Milestone 5 — Launch hardening — not started

All completed milestones were self-verified per `agents.md`'s checklist (build/lint/typecheck clean, real end-to-end LLM calls, browser-driven manual testing, error paths triggered on purpose) before being presented for human review. M1 and M2 were approved; M3 is awaiting review.

## Git

- Repo is on branch `main` and, as of this session, up to date with `origin/main` (the earlier push-auth blocker noted in a prior version of this file has been resolved — `git status` now shows a clean sync with the remote).
- Git author identity for this repo (local, not global): `Lakshya-Khanna-1 <lakshya1khanna@gmail.com>`.
- **M3's work is uncommitted** — per `agents.md`, commits happen after human review approves the milestone, not before. Once approved, commit with a message like `Milestone 3: real UI (design system, landing page, create flow, review screen)`.

## Running it

```
npm install
npm run dev        # http://localhost:3000
```

Requires `.env.local` (gitignored, not committed) with a real `OPENROUTER_API_KEY`. See `.env.example` for the full var list. Get a key at https://openrouter.ai/keys.

Dev-only test pages (404 in production builds):
- `/dev/clarify-test` — hits `/api/generate/clarify` directly, shows raw JSON.
- `/dev/pipeline-test` — runs the full brief→spec→tasks→agents SSE pipeline, shows live streaming, has a working zip-download button.

## What's built (M1 + M2)

**`lib/llm.ts`** — the single OpenRouter wrapper. All model slugs/tiers/max_tokens live here (`TIER_CONFIG`). Two entry points: `callLlm()` (blocking) and `streamLlm()` (token-by-token via SSE from OpenRouter, used for the markdown doc stages). Both have automatic one-shot fallback to `FALLBACK_MODEL` — `streamLlm` only falls back if the primary failed *before* any content streamed out, to avoid duplicating partial output.

**Pipeline** (`lib/brief.ts`, `lib/docs/{spec,tasksDoc,agentsDoc}.ts`, `lib/docs/generateDoc.ts`):
1. `generateBrief(idea, answers)` → zod-validated structured JSON brief. Retries once on invalid JSON.
2. `generateSpecDoc(brief)`, `generateTasksDoc(brief, spec)`, `generateAgentsDoc(brief, spec)` → markdown docs. Each goes through `generateMarkdownDoc()`, a shared helper that checks required section headings + banned filler phrases (`lib/promptGuidelines.ts`) and regenerates once if either check fails.

**Routes:**
- `POST /api/generate/clarify` — idea → 4-6 clarification questions (JSON mode, non-streaming).
- `POST /api/generate/pipeline` — SSE stream of the full brief→spec→tasks→agents run. Event shapes: `{stage, status: start|streaming(via chunk event)|restart|complete|error, ...}`. See `app/api/generate/pipeline/route.ts` for the exact payloads, and `components/dev/PipelineTestClient.tsx` for a working client-side parser.
- `POST /api/generate/zip` — takes `{name, agentsMd, specMd, tasksMd}`, returns a `<slug>-specs.zip` binary download.
- `proxy.ts` (Next 16's middleware successor) rate-limits all `/api/generate/*` at 5 req/min/IP, in-memory (fine for pre-auth v1; swap for a durable store before multi-instance prod).

## What's built (M3)

**Design system** — Ember Forge palette (near-black warm charcoal background, ember-orange `#ff6a3d` accent) as CSS custom properties in `app/globals.css` `@theme inline`; Fraunces (display/headings) + Inter (body) via `next/font/google` in `app/layout.tsx`, Geist Mono kept for doc/code previews. Dark-only by design (no light mode) — a deliberate scope call, not an oversight; spec.md §8 asks for "dark-leaning," not light/dark parity, and non-goals don't require it.

**Shared primitives** (`components/ui/`) — `Button`, `Card`, `Container`, `Badge`, `TextArea`, `Tabs` (keyboard-navigable, arrow-key roving tabindex), `Stepper` (status icons: pending/active/complete/error). `lib/variants.ts` has a tiny `cx()` helper instead of pulling in `class-variance-authority`.

**Landing page** (`app/page.tsx` + `components/landing/`) — hero with a real (non-lorem-ipsum) example `spec.md` excerpt in a scrollable card (`lib/exampleDoc.ts`), 3-step how-it-works, static pricing (Free vs. Pro-"coming soon"), FAQ accordion (native `<details>`, no JS framework needed), footer.

**`/create` flow** (`components/create/`) — a single client-side step machine (`CreateFlow.tsx`: idea → clarify → generate → review), state held in React state only (no persistence across refresh — matches spec.md §9's "no versioning/history beyond current session").
- `IdeaStep` — textarea, min-20-char validation (shared `lib/constants.ts` so both client and server code use the same constant — `lib/clarify.ts` re-exports it for backward compat).
- `ClarifyStep` — all questions on one scrolling form (not a per-question wizard — matches spec.md's "quick tappable form" wording), each question independently skippable via "Let AI decide", live answered-count badge.
- `GenerateStep` — reuses the SSE parsing approach from `components/dev/PipelineTestClient.tsx` but polished: a `Stepper` for the 4 pipeline stages plus a live streaming text panel (typing cursor, auto-scroll) for the doc currently being written. Remounts via a `key` on retry rather than manually resetting state (cleaner than an effect-body `setState`, which the new `react-hooks/set-state-in-effect` lint rule flags).
- `ReviewStep` — tabbed doc viewer using a new shared `components/docs/MarkdownDoc.tsx` (react-markdown + remark-gfm, custom-styled components — no `@tailwindcss/typography`, to keep the rendered look distinctive rather than generic "prose" styling). Copy-to-clipboard, **Regenerate this doc**, Download zip.

**New API route** — `POST /api/generate/regenerate` (`app/api/generate/regenerate/route.ts`): `{docType: "spec"|"tasks"|"agents", brief, specMd?}` → reuses the existing `generateSpecDoc`/`generateTasksDoc`/`generateAgentsDoc` functions from M2, returns the new doc as plain JSON (not SSE — single-doc regen didn't need streaming complexity). Covered automatically by the existing per-IP rate limit in `proxy.ts` (`/api/generate/*` matcher).

**Scope decision flagged and resolved with the human before building:** spec.md §6 lists "regeneration of individual docs" as a Pro benefit, but tasks.md's M3 task list asks for a working Regenerate button now, before tiers exist (M4). Resolved (human approved): build it fully, unrestricted, since there's no tier system yet to gate it against — M4 can add Pro-gating/credit deduction on top later.

New dependencies: `react-markdown`, `remark-gfm` (markdown rendering for the review screen and landing-page example — justified per agents.md's "keep dependencies minimal" rule since spec.md §3 explicitly requires "rendered markdown" viewing).

## Verified quality (M3)

- `npm run build`, `npm run lint`, `tsc --noEmit` all clean.
- Full browser-driven pass via a temporary Playwright harness (not committed — lives outside the repo in the session scratchpad) against the real dev server: landing page at 375/768/1440px, FAQ accordion interaction, idea-step validation (Continue button confirmed disabled under 20 chars), and a complete real idea → clarify → generate → review run end-to-end with a real LLM (idea: an apartment houseplant-watering tracker). Zero browser console errors across the whole run. One caught `pageerror` (`clipboard.writeText` permission denied) is a headless-automation-only limitation (no clipboard permission grant in the test harness), not an app bug.
- Manually verified `/api/generate/regenerate` directly: a real "spec" regeneration returns 200 with fresh content; missing `specMd` for a "tasks"/"agents" regen correctly 400s; an invalid `docType` correctly 400s with the zod validation detail.
- Generated doc quality inspected against spec.md §7's rubric on the review screen — concrete acceptance criteria, real entities/fields (e.g. `PlantSpecimen`, `nextWaterDue`), milestone-grouped checkbox tasks with human checkpoints — consistent with the M2 quality bench.
- One rendering artifact investigated and ruled out: a `fullPage: true` Playwright screenshot of the landing page appeared to show the sticky header twice. Confirmed via DOM query (`header` count === 1) and a viewport-only screenshot that this is a known Chromium full-page-screenshot stitching artifact with `position: sticky` elements, not a real duplication — normal scrolling in a real browser does not exhibit it.
- Not run: an automated accessibility audit (e.g. axe-core). Manual checks only — semantic elements, `aria-label`/`aria-pressed`/`role="tab"` where relevant, global `:focus-visible` outline, keyboard-operable `Tabs` (arrow keys) and native `<details>` FAQ. Flagging this as a gap rather than claiming full a11y coverage.

## Verified quality (M2 quality bench)

5 distinct ideas run through the full pipeline for real — vague, detailed, weird/whimsical, non-technical-founder-voice, and an intentionally over-scoped idea. All 5 passed spec.md §7's rubric (concrete acceptance criteria, real entities/fields, small milestone-grouped tasks, project-specific agents.md, zero banned filler). The over-scoped idea correctly got bounded into a buildable v1 rather than sprawling. Full outputs aren't saved in-repo (they were scratch-dir artifacts) — rerun `/dev/pipeline-test` to reproduce.

## Bug found + fixed during M2 verification

The SSE route double-called `controller.close()` on any stage failure, throwing "Controller is already closed" into the logs. Fixed by making `enqueue`/`close` defensive in `app/api/generate/pipeline/route.ts` (swallow already-closed errors — this can legitimately happen on client disconnect, not just the original bug). Confirmed clean before/after across multiple runs.

## Known limitations / deferred (not blockers, just flagged)

- Streaming LLM calls have no mid-stream stall timeout — the abort timer only covers time-to-first-byte. Revisit if stalled generations become a real problem.
- Rate limiter is in-memory/per-instance. Fine for now per spec.md §6 ("IP-based is fine pre-auth"); needs a durable store (e.g. Upstash Redis) before running multiple server instances.
- Ambitious/large-scope ideas can take several minutes end-to-end (each of spec/tasks/agents is its own multi-thousand-token streamed generation). Milestone 3's UI needs to make that wait feel intentional (progress state, streaming preview) rather than looking hung — spec.md §4/§8 already call for this.
- Occasional transient `LLM_FAILURE` from OpenRouter under heavy back-to-back testing (looked like provider-side throttling, not a code bug) — the pipeline surfaces these as clean stage-level SSE errors rather than crashing, which is correct behavior; just noting it's not zero-flake.

## Next up: Milestone 4

Per `tasks.md` — free-tier limits (3 gens/month per IP+fingerprint) with an upgrade-CTA limit screen, watermark line on free docs, magic-link email auth (purchase-only), Lemon Squeezy integration (credit packs) with a webhook → credit balance, Pro pipeline (GLM 5.2-class model, extras docs, critique pass, no watermark), credit deduction + balance display. The M3 Pricing section already has a "Coming soon" Pro card and disabled CTA button ready to wire up once payments land.
