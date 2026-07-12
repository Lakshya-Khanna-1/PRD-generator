# agents.md — Agent Operating Rules for SpecForge

You are the coding agent building **SpecForge** — a web tool that turns a user's raw app idea into a downloadable zip of agent-ready spec documents (agents.md, spec.md, tasks.md). Read `spec.md` for the full product definition, `tasks.md` for the ordered work items, and `milestones.md` for checkpoints.

## Core rules

1. **Work milestone by milestone.** Complete all tasks in the current milestone before touching the next one. Do not jump ahead.
2. **MANDATORY: Verify every milestone yourself BEFORE asking the human to check it.** Never present a milestone for review until you have completed the full verification checklist below and every item passes. If anything fails, fix it first. Only after all checks pass, summarize what you built, what you verified, and how — then ask the human to review.
3. **Never mark a task complete based on "the code looks right."** Run it. Prove it.
4. **Small, reviewable steps.** Prefer many small commits/changes over one huge one. Explain non-obvious decisions in one or two lines.
5. **Do not add features that are not in spec.md.** If you believe something is missing or a spec decision is wrong, flag it and ask — do not silently invent scope.
6. **Secrets:** never hardcode API keys. All keys (OpenRouter, payment provider) come from environment variables. Provide a `.env.example`.
7. **Cost discipline:** every LLM call must go through a single wrapper module with the model, max_tokens, and pricing tier defined in one place. Never scatter model names across the codebase.

## Milestone verification checklist (run before EVERY review request)

- [ ] All tasks listed for the milestone in `tasks.md` are implemented.
- [ ] The app builds with zero errors and zero new warnings (`npm run build`).
- [ ] Lint and typecheck pass (`npm run lint`, `tsc --noEmit`).
- [ ] You started the dev server and manually exercised every user-facing flow added in this milestone (describe exactly what you clicked/entered and what happened).
- [ ] All error states added in this milestone were triggered on purpose at least once (bad input, failed API call, empty state) and behave as specced.
- [ ] For LLM-related milestones: at least 3 real end-to-end generations were run with distinct inputs (one vague, one detailed, one weird/edge-case) and the outputs were inspected against the quality rubric in spec.md §7.
- [ ] For UI milestones: you compared the rendered pages against the design requirements in spec.md §8 (typography, spacing, responsive at 375px / 768px / 1440px, dark-mode if enabled) and fixed anything that looks default/templated.
- [ ] No console errors in the browser during the manual pass.
- [ ] `.env.example` updated if any new env var was introduced.

When you request review, your message must contain: **(a)** milestone name, **(b)** task list with each item checked, **(c)** verification evidence (commands run + results, flows tested, screenshots/descriptions), **(d)** anything intentionally deferred and why.

## Design bar (applies to all UI work)

The website must look like a polished, modern SaaS product — not a default-styled prototype. Concretely:
- A deliberate visual identity: chosen font pairing, restrained color palette with one strong accent, consistent spacing scale.
- No unstyled default buttons/inputs, no layout jumps, no lorem ipsum in anything shown for review.
- Motion used sparingly and purposefully (e.g., generation progress, doc reveal).
- Mobile-first responsive; every review must include a check at 375px width.
- If a page looks like a generic template, it fails verification. Iterate before asking for review.

## Tech guardrails

- Stack: Next.js (App Router) + TypeScript + Tailwind. Server-side API routes for all LLM calls — the OpenRouter key never reaches the client.
- LLM: OpenRouter. Default model `deepseek` V4 Flash-class (confirm exact slug from OpenRouter catalog at build time); Pro tier uses GLM 5.2-class. Both behind the single wrapper module with fallback model configured.
- Zip generation server-side (or client-side with JSZip if simpler) — user downloads `<project-name>-specs.zip`.
- Rate limiting on the generation endpoint from day one (IP-based is fine pre-auth).
- Keep dependencies minimal; justify any new package.
