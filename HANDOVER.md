# HANDOVER.md — SpecForge

Snapshot of project state for whoever (human or agent) picks this up next. Read `agents.md`, `spec.md`, `tasks.md`, `milestones.md` first — this file only covers what those don't: current status, what's been verified, and what's blocking.

## Status: Milestone 4 of 5 complete (pending human review)

- [x] **Milestone 1 — Skeleton & LLM wrapper** (commit `8c0752d`)
- [x] **Milestone 2 — Full generation pipeline** (commit `6b661b2`)
- [x] **Milestone 3 — Real UI ("make the website look good")** (commit `90436c4`, pushed)
- [x] **Milestone 4 — Tiers, limits & payments** — **re-scoped** (payments deferred, see below); built and self-verified this session, not yet committed
- [ ] Milestone 5 — Launch hardening — not started

All completed milestones were self-verified per `agents.md`'s checklist (build/lint/typecheck clean, real end-to-end LLM calls, browser-driven manual testing, error paths triggered on purpose) before being presented for human review. M1, M2, and M3 were approved; M4 is awaiting review.

## Git

- Repo is on branch `main`, up to date with `origin/main` through M3 (`90436c4`).
- Git author identity for this repo (local, not global): `Lakshya-Khanna-1 <lakshya1khanna@gmail.com>`.
- **M4's work is uncommitted** — per `agents.md`, commits happen after human review approves the milestone, not before.

## Milestone 4 scope decision — payments deferred

The human explicitly chose to skip payments/Lemon Squeezy entirely for this pass, and also chose to drop the monthly free-tier generation cap (task 4.1) rather than build it without a Pro tier to upsell into. Since spec.md §6 originally scoped magic-link auth and credit tracking as existing *only* to support purchases, deferring payments meant deferring auth, credits, and the Pro pipeline too — there was nothing left for them to gate. `spec.md` §6, `tasks.md`'s M4 section, and `milestones.md`'s M4 entry were all updated to reflect this honestly rather than describing unbuilt payment infrastructure as pending work.

**What actually got built:** a single centralized watermark append (`WATERMARK` in `lib/docs/shared.ts`, applied in `lib/docs/generateDoc.ts`'s `generateMarkdownDoc()` — the shared function all three doc generators and the M3 regenerate endpoint already funnel through) so every generated doc, everywhere it's generated or regenerated, gets `"Generated with SpecForge"` at the bottom with zero per-route changes needed.

**Infra decisions already made, preserved here for whenever payments are picked back up** (discussed with the human this session before the scope was reduced):
- **Persistence:** Upstash Redis (not Postgres) — fits the actual data shape (counters, small records, no relational queries needed), no schema/migrations, serverless-friendly. `lib/rateLimit.ts`'s own comment already named this as the intended upgrade path.
- **Magic-link email:** Resend.
- **Fingerprinting** (for the deferred "per IP+fingerprint" free-tier cap): open-source `@fingerprintjs/fingerprintjs`, not the paid Fingerprint Pro service.
- **Payments:** Lemon Squeezy — the human had not yet created an account/store when this was discussed; that setup (store, credit-pack product/variant, API key, webhook signing secret) is a prerequisite before Lemon Squeezy work can start.

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
- Ambitious/large-scope ideas can take several minutes end-to-end (each of spec/tasks/agents is its own multi-thousand-token streamed generation). Milestone 3's `/create` generation screen already makes this feel intentional (stepper + live streaming preview) rather than looking hung.
- Occasional transient `LLM_FAILURE` from OpenRouter under heavy back-to-back testing (looked like provider-side throttling, not a code bug) — the pipeline surfaces these as clean stage-level SSE errors rather than crashing, which is correct behavior; just noting it's not zero-flake.

## Next up: Milestone 5

Per `tasks.md` — error tracking (Sentry) + basic funnel analytics, token-cost dashboard/log check (verify < $0.01/free generation from real logs), SEO/meta/OG images + shareable example output page, legal pages (terms, privacy — state what happens to submitted ideas and which model providers process them), production deploy to Vercel with env vars + rate limits verified in prod, final regression (3 fresh ideas through the free flow in production).

Note: M5's original "go/no-go for public launch" framing assumed monetization would exist by then. Since M4 deferred payments, M5 should launch as a free tool, not a paid product — worth confirming with the human before starting M5 in case that changes M5's scope too (e.g. whether a "Buy me a coffee"-style link belongs on the landing page instead of the deferred Pro tier, or whether M5 should also revisit the Lemon Squeezy question).
