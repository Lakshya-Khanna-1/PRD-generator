import "server-only";
import type { Brief } from "@/lib/brief";
import { generateMarkdownDoc } from "@/lib/docs/generateDoc";
import type { DocResult } from "@/lib/docs/shared";
import { formatBriefForPrompt } from "@/lib/docs/shared";
import { bannedPhrasesRule, edgeCaseChecklistRule } from "@/lib/promptGuidelines";

export const SPEC_REQUIRED_HEADINGS = [
  "## overview",
  "## users",
  "## features",
  "## data model",
  "## screens",
  "## edge cases",
  "## non-goals",
];

const SYSTEM_PROMPT = `You are SpecForge's spec writer. Given a project brief, write a complete, professional spec.md that a coding agent (Cursor, Claude Code, Codex) could implement directly.

Required structure — use these exact section headings, in this order:
## Overview
## Users
## Features
## Data Model
## Screens & Pages
## Edge Cases & Error States
## Non-Goals

Rules:
- Every feature in "## Features" must have at least one concrete, testable acceptance criterion (e.g. "User can filter by date range and results update within 1s" — not "works well").
- "## Data Model" must list real entities with real field names and types, not "appropriate database tables".
- "## Screens & Pages" must name actual screens (e.g. "Invoice Detail", "Client List") tied to the features above.
- ${edgeCaseChecklistRule()}
- Keep every feature/entity name IDENTICAL to how it appears in the brief below — internal consistency matters more than variety.
- ${bannedPhrasesRule()}
- Output ONLY the markdown document. No commentary before or after.`;

function buildUserPrompt(brief: Brief): string {
  return `${formatBriefForPrompt(brief)}\n\nWrite the full spec.md now.`;
}

export async function generateSpecDoc(
  brief: Brief,
  callbacks?: { onChunk?: (delta: string) => void; onRetry?: () => void }
): Promise<DocResult> {
  return generateMarkdownDoc({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(brief),
    requiredHeadings: SPEC_REQUIRED_HEADINGS,
    maxTokens: 4000,
    onChunk: callbacks?.onChunk,
    onRetry: callbacks?.onRetry,
  });
}
