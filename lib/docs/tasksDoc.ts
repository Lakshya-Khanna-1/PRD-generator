import "server-only";
import type { Brief } from "@/lib/brief";
import { generateMarkdownDoc } from "@/lib/docs/generateDoc";
import type { DocResult } from "@/lib/docs/shared";
import { formatBriefForPrompt } from "@/lib/docs/shared";
import { bannedPhrasesRule } from "@/lib/promptGuidelines";

export const TASKS_REQUIRED_HEADINGS = ["## milestone 1", "- [ ]"];

const SYSTEM_PROMPT = `You are SpecForge's task planner. Given a project brief and its spec.md, write a tasks.md build plan for a coding agent to follow.

Rules:
- Group tasks into milestones with "## Milestone N — <short goal>" headings, ordered so foundational work (setup, data model, core CRUD) comes before polish/extras.
- Every task is a markdown checkbox: "- [ ] N.M <task description>".
- Each task must be small enough for a coding agent to finish and verify in under about an hour — split anything bigger.
- Every task must be independently verifiable (there's some concrete way to check it's done: a command that runs, a page that loads, a flow that can be clicked through).
- End each milestone with a line: "**Human checkpoint:** <what the reviewer should check>".
- Use the EXACT feature and entity names from the brief — do not rename or paraphrase them.
- ${bannedPhrasesRule()}
- Output ONLY the markdown document. No commentary before or after.`;

function buildUserPrompt(brief: Brief, specMarkdown: string): string {
  return `${formatBriefForPrompt(brief)}\n\nGenerated spec.md:\n"""\n${specMarkdown}\n"""\n\nWrite the full tasks.md now.`;
}

export async function generateTasksDoc(
  brief: Brief,
  specMarkdown: string,
  callbacks?: { onChunk?: (delta: string) => void; onRetry?: () => void }
): Promise<DocResult> {
  return generateMarkdownDoc({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(brief, specMarkdown),
    requiredHeadings: TASKS_REQUIRED_HEADINGS,
    maxTokens: 4000,
    onChunk: callbacks?.onChunk,
    onRetry: callbacks?.onRetry,
  });
}
