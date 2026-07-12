import "server-only";
import type { Brief } from "@/lib/brief";
import { generateMarkdownDoc } from "@/lib/docs/generateDoc";
import type { DocResult } from "@/lib/docs/shared";
import { formatBriefForPrompt } from "@/lib/docs/shared";
import { bannedPhrasesRule } from "@/lib/promptGuidelines";

export const AGENTS_REQUIRED_HEADINGS = ["## core rules", "verify", "before", "review"];

const SYSTEM_PROMPT = `You are SpecForge's agent-instructions writer. Given a project brief and its spec.md, write an agents.md that will be dropped into a coding agent's (Cursor / Claude Code / Codex) repo as its operating rules.

Required structure — use these exact section headings, in this order:
## Core Rules
## Milestone Verification Checklist

Rules:
- "## Core Rules" MUST include, word-for-word in spirit, a mandatory rule that the agent must fully verify a milestone itself (build it, run it, exercise the flows) BEFORE ever requesting human review — never mark a task done because "the code looks right."
- "## Milestone Verification Checklist" must be tailored to THIS project specifically: reference the actual feature names, data entities, and platform from the brief below — not generic boilerplate like "test the app."
- Include concrete verification steps appropriate to the stated platform (e.g. for a web app: build command, manual flow walkthrough, checking error states for each real feature listed; for a mobile app: adapt accordingly).
- Include a rule about never hardcoding secrets/API keys — env vars only.
- ${bannedPhrasesRule()}
- Output ONLY the markdown document. No commentary before or after.`;

function buildUserPrompt(brief: Brief, specMarkdown: string): string {
  return `${formatBriefForPrompt(brief)}\n\nGenerated spec.md:\n"""\n${specMarkdown}\n"""\n\nWrite the full agents.md now.`;
}

export async function generateAgentsDoc(
  brief: Brief,
  specMarkdown: string,
  callbacks?: { onChunk?: (delta: string) => void; onRetry?: () => void }
): Promise<DocResult> {
  return generateMarkdownDoc({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(brief, specMarkdown),
    requiredHeadings: AGENTS_REQUIRED_HEADINGS,
    maxTokens: 3000,
    onChunk: callbacks?.onChunk,
    onRetry: callbacks?.onRetry,
  });
}
