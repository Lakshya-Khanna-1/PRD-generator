# tasks.md — SpecForge Build Plan

Tasks are grouped by milestone. Complete a milestone fully, run the verification checklist in `agents.md`, THEN request human review. Do not start the next milestone until the current one is approved.

## Milestone 1 — Skeleton & LLM wrapper (foundation)

- [ ] 1.1 Scaffold Next.js (App Router) + TypeScript + Tailwind project with clean folder structure (`app/`, `lib/`, `components/`).
- [ ] 1.2 Create `.env.example` with `OPENROUTER_API_KEY`, `DEFAULT_MODEL`, `PRO_MODEL`, `FALLBACK_MODEL`.
- [ ] 1.3 Build `lib/llm.ts` wrapper: single function for all OpenRouter calls (model, messages, max_tokens, JSON mode flag), server-side only, with fallback model, timeout, error typing, and token-usage logging.
- [ ] 1.4 Build `/api/generate/clarify` route: accepts raw idea, returns JSON clarification questions. Includes the Clarify prompt template.
- [ ] 1.5 Basic test page (dev-only) to hit the clarify endpoint and display raw JSON.
- [ ] 1.6 IP-based rate limiting middleware on all `/api/generate/*` routes.

**Human checkpoint:** review architecture, wrapper design, and one real clarify response.

## Milestone 2 — Full generation pipeline (the core IP)

- [ ] 2.1 Write and iterate the **Brief** prompt: raw idea + answers → structured JSON brief. Validate with zod; retry once on invalid JSON.
- [ ] 2.2 Write the **spec.md** generation prompt (template-enforced sections, banned-phrases list, edge-case checklist).
- [ ] 2.3 Write the **tasks.md** generation prompt (milestone-grouped, small verifiable tasks).
- [ ] 2.4 Write the **agents.md** generation prompt — MUST include the tailored "verify milestone before requesting review" rule and project-specific checklist.
- [ ] 2.5 Orchestration route/streaming: sequential pipeline with server-sent events so the client can show per-doc progress and streaming text.
- [ ] 2.6 Zip assembly: bundle docs into `<slug>-specs.zip`, served as download.
- [ ] 2.7 Run the quality bench: 5 distinct test ideas (vague / detailed / weird / non-technical / ambitious) through the full pipeline; score outputs against spec.md §7 rubric; iterate prompts until all 5 pass.

**Human checkpoint:** review the 5 benchmark outputs + downloaded zips.

## Milestone 3 — Real UI: "make the website look good"

- [x] 3.1 Design pass first: pick font pairing, palette with one accent, spacing scale; document tokens in Tailwind config.
- [x] 3.2 Landing page: hero with real example doc preview, 3-step how-it-works, pricing section (static for now), FAQ, footer.
- [x] 3.3 Idea input screen with quality placeholder example and validation.
- [x] 3.4 Clarification form UI: tappable options, "let AI decide" per question, progress indicator.
- [x] 3.5 Generation screen: sequential per-doc progress with streaming markdown preview — this must feel polished and satisfying.
- [x] 3.6 Review screen: tabbed doc viewer (rendered markdown), Copy / Regenerate-this-doc / Download zip actions.
- [x] 3.7 Responsive + accessibility pass at 375 / 768 / 1440px; keyboard navigation; empty/error/loading states for every screen.
- [x] 3.8 Anti-template pass: review every page against agents.md "Design bar"; fix anything that looks default.

**Human checkpoint:** the whole product should look launch-ready. Reviewer will judge the design hard.

## Milestone 4 — Tiers, limits & payments (re-scoped: payments deferred)

Per explicit human direction, payments are deferred and the product stays a single free, unlimited tier for now. Everything below except 4.2 depended on a purchase existing (spec.md §6: auth/credits "added only for purchase/credit tracking") — with no payments, there's nothing for them to gate. See `HANDOVER.md` for the infra choices already decided for whenever this is picked back up (Upstash Redis, Resend, Lemon Squeezy).

- [x] 4.2 Watermark line appended to every generated doc (single tier now, so always-on — see `lib/docs/shared.ts` `WATERMARK`).
- [ ] ~~4.1 Free-tier limits (3 generations/month per IP+fingerprint)~~ — **deferred.** No cap for now; the existing per-IP burst rate limit from M1 (`lib/rateLimit.ts`) remains the only abuse guard.
- [ ] ~~4.3 Magic-link email auth~~ — **deferred.** Only existed to support purchase/credit tracking.
- [ ] ~~4.4 Payment provider integration (Lemon Squeezy)~~ — **deferred.**
- [ ] ~~4.5 Pro pipeline (GLM 5.2-class model, extras docs, critique pass, no watermark)~~ — **deferred.** Nothing to unlock it without payments.
- [ ] ~~4.6 Credit deduction + balance display~~ — **deferred.**

**Human checkpoint:** watermark line confirmed present on all 3 doc types, in both the review screen and the downloaded zip.

## Milestone 5 — Launch hardening

- [ ] 5.1 Error tracking (e.g., Sentry) + basic analytics (page views, funnel: land → input → generate → download).
- [ ] 5.2 Token-cost dashboard/log check: verify < $0.01 per free generation from real logs.
- [ ] 5.3 SEO/meta/OG images; shareable example output page.
- [ ] 5.4 Legal pages: terms, privacy (state clearly what happens to submitted ideas and which model providers process them).
- [ ] 5.5 Production deploy (Vercel), env vars set, rate limits verified in prod.
- [ ] 5.6 Final full regression: 3 fresh ideas through free flow + 1 through pro flow in production.

**Human checkpoint:** go/no-go for public launch.
