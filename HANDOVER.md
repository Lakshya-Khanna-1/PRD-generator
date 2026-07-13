# HANDOVER.md — SpecForge

Snapshot of project state for whoever (human or agent) picks this up next. Read `agents.md`, `spec.md`, `tasks.md`, `milestones.md` first — this file only covers what those don't: current status, what's been verified, and what's blocking.

## Status: Milestone 5 of 5 complete (pending human review) — code-complete, not yet deployed

- [x] **Milestone 1 — Skeleton & LLM wrapper** (commit `8c0752d`)
- [x] **Milestone 2 — Full generation pipeline** (commit `6b661b2`)
- [x] **Milestone 3 — Real UI ("make the website look good")** (commit `90436c4`, pushed)
- [x] **Milestone 4 — Tiers, limits & payments** — **re-scoped** (payments deferred, see below) (commit `27ca98c`, pushed)
- [x] **Milestone 5 — Launch hardening** — **re-scoped** (no analytics, no self-serve deploy — see below); built and self-verified this session, not yet committed

All completed milestones were self-verified per `agents.md`'s checklist (build/lint/typecheck clean, real end-to-end LLM calls, browser-driven manual testing, error paths triggered on purpose) before being presented for human review. M1-M4 were approved; M5 is awaiting review. **The app itself is not yet live in production** — see the deploy checklist below; that step requires the human's own Vercel login.

## Git

- Repo is on branch `main`, up to date with `origin/main` through M4 (`27ca98c`).
- Git author identity for this repo (local, not global): `Lakshya-Khanna-1 <lakshya1khanna@gmail.com>`.
- **M5's work is uncommitted** — per `agents.md`, commits happen after human review approves the milestone, not before.

## Milestone 4 scope decision — payments deferred

The human explicitly chose to skip payments/Lemon Squeezy entirely for this pass, and also chose to drop the monthly free-tier generation cap (task 4.1) rather than build it without a Pro tier to upsell into. Since spec.md §6 originally scoped magic-link auth and credit tracking as existing *only* to support purchases, deferring payments meant deferring auth, credits, and the Pro pipeline too — there was nothing left for them to gate. `spec.md` §6, `tasks.md`'s M4 section, and `milestones.md`'s M4 entry were all updated to reflect this honestly rather than describing unbuilt payment infrastructure as pending work.

**What actually got built:** a single centralized watermark append (`WATERMARK` in `lib/docs/shared.ts`, applied in `lib/docs/generateDoc.ts`'s `generateMarkdownDoc()` — the shared function all three doc generators and the M3 regenerate endpoint already funnel through) so every generated doc, everywhere it's generated or regenerated, gets `"Generated with SpecForge"` at the bottom with zero per-route changes needed.

**Infra decisions already made, preserved here for whenever payments are picked back up** (discussed with the human this session before the scope was reduced):
- **Persistence:** Upstash Redis (not Postgres) — fits the actual data shape (counters, small records, no relational queries needed), no schema/migrations, serverless-friendly. `lib/rateLimit.ts`'s own comment already named this as the intended upgrade path.
- **Magic-link email:** Resend.
- **Fingerprinting** (for the deferred "per IP+fingerprint" free-tier cap): open-source `@fingerprintjs/fingerprintjs`, not the paid Fingerprint Pro service.
- **Payments:** Lemon Squeezy — the human had not yet created an account/store when this was discussed; that setup (store, credit-pack product/variant, API key, webhook signing secret) is a prerequisite before Lemon Squeezy work can start.

## Running it

Windows: double-click `Start-SpecForge.bat` — installs deps, checks `.env.local`, starts the dev server, opens the browser.

Any OS:
```
npm install
npm run dev        # http://localhost:3000
```

Requires `.env.local` (gitignored, not committed) with a real `OPENROUTER_API_KEY`. See `.env.example` for the full var list, `README.md` for the project overview, and `SETUP.md` for the full local-setup + Vercel deploy walkthrough (this section is a quick-reference summary, SETUP.md is the source of truth).

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

## Milestone 5 scope decisions

Confirmed with the human before building:
- **Launch as a free tool.** M5's original "go/no-go for public launch" framing assumed monetization existed by now; since M4 deferred payments, M5 proceeds as originally scoped but framed around a free product, not a paid one.
- **No analytics.** "No analytics since it is just free" — task 5.1's funnel-analytics half is dropped entirely; only error tracking (Sentry) was built.
- **No deploy by me.** The human has a Vercel account and will connect/deploy it themselves — I can't do a Vercel login headlessly. My job was to make the repo deploy-ready and hand over an exact checklist, not to run the deploy or the prod regression.
- **Legal identity:** Terms/Privacy use "Lakshya Khanna" / `lakshya1khanna@gmail.com` (this repo's existing git author identity), no specific jurisdiction named (kept generic) — confirmed with the human rather than inventing a business entity.

## What's built (M5)

**Error tracking** — `@sentry/nextjs`, wired through `instrumentation.ts` (server+edge) and `instrumentation-client.ts` (browser), both fully gated on `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` env vars being set — with nothing configured, `Sentry.init` is never called and the app behaves exactly as before. `next.config.ts` wraps the config with `withSentryConfig`, source-map upload explicitly disabled (`sourcemaps: { disable: true }`) so the build never needs a `SENTRY_AUTH_TOKEN`. `app/global-error.tsx` is a branded (Ember Forge, not default Next.js) error boundary that calls `Sentry.captureException`. **Verified:** build stays clean with zero Sentry env vars set (proving the no-op gating), and the error boundary renders correctly when a client error is triggered. **Not verified:** actual event delivery to a real Sentry project — there's no DSN to test against yet. Get one free at sentry.io and set `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` to activate it.

**Cost verification** — ran one real end-to-end generation (idea: houseplant watering tracker) against a temporary local instance with logs captured, summed the `lib/llm.ts` `logUsage()` token counts across all 5 LLM calls (brief, spec, tasks, agents, plus one automatic retry), and priced them against OpenRouter's live `/api/v1/models` pricing for `deepseek/deepseek-v4-flash` ($0.077/M prompt tokens, $0.154/M completion tokens as of this session). **Actual cost: $0.00296 per generation** — well under spec.md §10's <$0.01 target.

**SEO / OG / example page** — `metadataBase` added to `app/layout.tsx` (driven by `NEXT_PUBLIC_SITE_URL`, new `lib/site.ts`), full Open Graph + Twitter card metadata, a dynamically-generated branded OG image at `app/opengraph-image.tsx` (`next/og`'s `ImageResponse`, no external design asset needed). New public `/example` page (`app/example/page.tsx` + `components/example/ExampleTabs.tsx`) showing a complete example doc set (spec.md/tasks.md/agents.md, extended in `lib/exampleDoc.ts`) for sharing — linked from the landing hero and footer.

**Legal pages** — `/terms` and `/privacy` (content in `lib/legal.ts`, rendered through the existing `MarkdownDoc` component via a shared `components/legal/LegalPage.tsx` — reuse, not new styling). Privacy policy explicitly names OpenRouter and the currently-configured underlying providers (DeepSeek/GLM/Gemini) as who processes submitted ideas, states there's no account system/persistent storage yet, and that IP addresses are used only for short-lived in-memory rate limiting. Linked from the footer on every page.

New dependency: `@sentry/nextjs` — justified per tasks.md 5.1's explicit error-tracking requirement.

## Deploy checklist (for the human — requires your own Vercel login)

1. **Connect the repo.** In the Vercel dashboard, "Add New Project" → import `Lakshya-Khanna-1/PRD-generator` from GitHub. Framework preset should auto-detect Next.js.
2. **Set environment variables** (Project Settings → Environment Variables), from `.env.example`:
   - `OPENROUTER_API_KEY` — required, your real key.
   - `DEFAULT_MODEL`, `PRO_MODEL`, `FALLBACK_MODEL` — copy the values from `.env.example` (or your own choices).
   - `NEXT_PUBLIC_SITE_URL` — set to your actual production domain once known (e.g. `https://specforge.vercel.app` or a custom domain) — this drives OG image/metadata absolute URLs.
   - `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — optional; leave unset to skip error tracking for launch, or create a free Sentry project first and set both to the same DSN.
3. **Deploy.** Vercel will run `npm run build` automatically.
4. **Important caveat — rate limiting on Vercel:** `lib/rateLimit.ts` is in-memory, scoped to a single server process. Vercel's serverless functions are not one persistent process — concurrent or cold-started invocations can each get their own memory, so the "5 req/min/IP" burst guard in `proxy.ts` degrades to "5 req/min/IP/instance" in production, not a hard global cap. This was flagged as a known limitation since M1; it's not a launch blocker for a free, low-traffic tool, but don't rely on it as a strict abuse guard under real load. Upgrading to Upstash Redis (already scoped in the M4 section above) is the fix if abuse becomes a real problem.
5. **Smoke-test in prod:** visit the deployed URL, confirm the landing page loads, `/create` runs a real generation end-to-end, and `/example`, `/terms`, `/privacy` all render.

## Post-deploy regression checklist (for the human, once live)

Per tasks.md 5.6, adjusted since Pro is deferred — run 4 fresh ideas through the free flow in production (not "3 free + 1 pro"), covering the same variety as the M2 quality bench:
1. A vague, underspecified idea.
2. A detailed, well-specified idea.
3. A weird/whimsical idea.
4. An idea written in a non-technical founder's voice.

For each: confirm clarify questions are sensible, generation completes without errors, the review screen shows all 3 docs with the watermark line, and the downloaded zip opens correctly.
