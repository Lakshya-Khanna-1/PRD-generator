# milestones.md — SpecForge Checkpoints

Each milestone ends with a **human review**. Per agents.md, the agent must complete the full self-verification checklist and present evidence BEFORE requesting review. A milestone is only "done" when the human approves it.

## M1 — Skeleton & LLM wrapper
**Goal:** Solid foundation; all LLM traffic through one safe, logged, fallback-enabled wrapper.
**Accept when:** project builds clean; clarify endpoint returns valid question JSON for 3 different ideas; rate limiting demonstrably blocks rapid repeat calls; no key exposure client-side.

## M2 — Generation pipeline
**Goal:** Raw idea → high-quality zip, reliably.
**Accept when:** all 5 benchmark ideas produce doc sets passing the spec.md §7 rubric; zip downloads correctly and opens in Cursor/Claude Code as usable specs; invalid-JSON and provider-failure paths handled gracefully.

## M3 — Real UI (design gate)
**Goal:** The product looks like a polished SaaS someone would pay for.
**Accept when:** every screen passes the agents.md Design bar; responsive at 375/768/1440; generation screen streaming feels smooth; zero console errors; reviewer subjectively approves the look — expect pushback and iterate.

## M4 — Tiers & payments (re-scoped: payments deferred)
**Goal (revised per explicit human direction):** keep the product a single free, unlimited tier; add the watermark line. Payments, credits, magic-link auth, and the Pro pipeline are deferred — see spec.md §6 for the decision and the infra choices preserved for later.
**Accept when:** every generated doc (spec.md, tasks.md, agents.md) carries the "Generated with SpecForge" watermark line, in both the review screen and the downloaded zip; tasks.md/spec.md accurately describe the deferral instead of unbuilt payment infrastructure.

## M5 — Launch hardening (re-scoped: free-tool launch, no self-serve deploy)
**Goal (revised per explicit human direction):** code-complete and safe to share publicly as a free tool — no analytics, deploy executed by the human via their own Vercel account rather than by the agent.
**Accept when:** error tracking wired up (no-op safe without a DSN); cost-per-generation verified from real logs (< $0.01); legal pages live in the repo; SEO/OG/example page built; a step-by-step deploy checklist and a post-deploy regression checklist exist in `HANDOVER.md` for the human to execute. Production deploy itself and the prod regression pass happen after this milestone is approved, not as part of it.

## Review protocol (every milestone)
The agent's review request must include:
1. Milestone name and full task checklist status.
2. Verification evidence: commands + results, flows manually tested, generations run and inspected.
3. Known gaps/deferrals with justification.
4. What the human should specifically look at.

If the human rejects, the agent fixes and re-verifies the FULL checklist before re-requesting review.
