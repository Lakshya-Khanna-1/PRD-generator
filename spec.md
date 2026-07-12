# spec.md — SpecForge Product Specification

## 1. One-liner

SpecForge turns a raw app idea typed by a user into a professional, downloadable zip of agent-ready spec documents (`agents.md`, `spec.md`, `tasks.md`, plus optional extras), designed to be dropped directly into Cursor, Claude Code, Codex, or any coding agent.

## 2. Problem & audience

- **Problem:** People building with AI coding agents get dramatically better results with well-structured specs, but most users don't know how to write agents.md/spec.md/tasks.md files. They paste a vague idea and get mediocre builds.
- **Audience:** Indie hackers, vibe-coders, students, and early-stage founders using Cursor / Claude Code / Codex / Windsurf. Non-technical founders briefing developers are a secondary audience.
- **Positioning:** "Turn your app idea into agent-ready specs" — NOT a generic "AI PRD generator."

## 3. Core user flow

1. **Landing page** → clear value prop, example output preview, single CTA: "Generate my specs."
2. **Idea input** → one large textarea: "Describe the app you want to build." Placeholder shows a good example. Min 20 chars.
3. **Clarification step** → the system sends the raw idea to the LLM which returns 4–6 targeted multiple-choice + short-answer questions (target users, platform, auth, data storage, monetization, must-have features). Rendered as a quick tappable form. User can skip any question ("let AI decide").
4. **Generation** → progress UI showing each document being generated in sequence (brief → spec.md → tasks.md → agents.md → extras). Streaming preview of the doc currently being written.
5. **Review screen** → tabbed viewer for each generated doc with rendered markdown. Buttons: "Regenerate this doc," "Download zip," "Copy doc."
6. **Download** → zip named `<slugified-project-name>-specs.zip`.

## 4. Generation pipeline (the product's core IP)

All calls go through one server-side wrapper. Pipeline stages, **one LLM call each**:

1. **Clarify:** raw idea → JSON array of clarification questions with options.
2. **Brief:** raw idea + answers → internal structured JSON brief (name, elevator pitch, users, platform, feature list with priorities, data entities, auth model, monetization, non-goals). This JSON is the single source of truth for all docs.
3. **spec.md:** brief → full specification (sections: overview, users, features with acceptance criteria, data model, screens/pages list, edge cases & error states, non-goals).
4. **tasks.md:** brief + generated spec → ordered task list grouped into milestones, each task small and verifiable.
5. **agents.md:** brief + spec → operating rules for the user's coding agent, including the mandatory "verify milestone before requesting review" rule and a verification checklist tailored to their project.
6. **Extras (Pro):** data-model.md, user-stories.md, and a tool-specific variant (CLAUDE.md or .cursorrules) chosen by the user.
7. **Critique pass (Pro):** model reviews the spec against the quality rubric (§7) and patches gaps in one revision call.

**Prompt requirements:** every generation prompt must (a) demand concrete specifics (real screen names, real entity fields), (b) ban vague filler phrases ("user-friendly," "scalable," "seamless"), (c) include an edge-case checklist the model must address (auth failures, empty states, permissions, deletion flows), (d) enforce exact markdown structure via a template in the prompt.

## 5. Models & cost

- **Free tier model:** DeepSeek V4 Flash-class via OpenRouter (confirm current slug). Route via non-training providers.
- **Pro tier model:** GLM 5.2-class via OpenRouter.
- Fallback model configured on OpenRouter so provider outages don't break generation.
- Target cost: < $0.01 per free generation, < $0.10 per pro generation. Log token usage per run.

## 6. Tiers & monetization (v1 — payments deferred)

**Current state, decided at Milestone 4:** payments are deferred. The product is a single free, unlimited tier: core 3 docs, watermark line at bottom of each doc ("Generated with SpecForge"), regeneration of individual docs included. No monthly cap, no auth, no payment provider. Abuse protection is the existing per-IP burst rate limit from Milestone 1 (`lib/rateLimit.ts` — 5 req/min/IP on `/api/generate/*`), not a persistent monthly quota.

**Deferred Pro-tier vision** (unchanged from the original plan, to build whenever monetization is picked back up):
- **Free:** 3 generations/month per IP+fingerprint, core 3 docs, watermark.
- **Pro:** one-time credit packs (e.g., 20 credits) AND/OR simple monthly plan — pick ONE (credit packs preferred; bursty usage). Pro = better model, extras docs, critique pass, no watermark.
- Payments: Lemon Squeezy (preferred for simpler global tax handling).
- **Auth:** none required for free tier (rate-limit by IP + fingerprint). Email-based magic-link auth added only for purchase/credit tracking.
- Infra choices already made for this future work (see `HANDOVER.md`): Upstash Redis for credit balances/purchase records/magic-link tokens/per-IP+fingerprint counts; Resend for magic-link email delivery; open-source `@fingerprintjs/fingerprintjs` for the client-side fingerprint half of "IP+fingerprint."

## 7. Output quality rubric (used in verification & critique pass)

A generated spec set passes if:
- Every feature has at least one concrete acceptance criterion.
- Data model lists real entities with fields, not "appropriate database tables."
- tasks.md tasks are individually completable in < ~1 hour of agent work and grouped into milestones.
- agents.md contains project-specific verification steps, not boilerplate.
- Zero banned filler phrases.
- Docs are internally consistent (same feature names, same entity names everywhere).

## 8. Design requirements

- Modern, confident SaaS aesthetic: distinctive font pairing, dark-leaning palette with one vivid accent, generous whitespace, subtle depth. Must NOT look like a default Tailwind/template page.
- Landing page: hero with live example of a generated doc (real content, scroll-in-a-card), 3-step "how it works," pricing section, FAQ, footer.
- Generation screen is the emotional peak: sequential progress with streaming text preview should feel satisfying to watch.
- Fully responsive (375px, 768px, 1440px checkpoints). Accessible: keyboard navigable, sensible contrast, focus states.

## 9. Non-goals (v1)

- No team features, no doc editing in-browser (regenerate only), no versioning/history beyond current session, no BYO-API-key, no "Sign in with ChatGPT" (not generally available), no multi-language output.

## 10. Success metrics

- Generation completion rate > 80% of started flows.
- Median time from landing to downloaded zip < 4 minutes.
- Cost per free generation < $0.01 verified from logs.
