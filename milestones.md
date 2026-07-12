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

## M4 — Tiers & payments
**Goal:** Money can be made.
**Accept when:** free limits enforced; test-mode purchase grants credits via webhook; pro generation uses pro model + extras + critique pass; watermark only on free docs.

## M5 — Launch hardening
**Goal:** Safe to share publicly.
**Accept when:** deployed to production; funnel analytics recording; cost-per-generation verified from logs; legal pages live; final regression passes in prod.

## Review protocol (every milestone)
The agent's review request must include:
1. Milestone name and full task checklist status.
2. Verification evidence: commands + results, flows manually tested, generations run and inspected.
3. Known gaps/deferrals with justification.
4. What the human should specifically look at.

If the human rejects, the agent fixes and re-verifies the FULL checklist before re-requesting review.
