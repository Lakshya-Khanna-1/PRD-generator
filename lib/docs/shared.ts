import "server-only";
import { BANNED_FILLER_PHRASES } from "@/lib/promptGuidelines";
import type { Brief } from "@/lib/brief";

/** Appended to every generated doc. There's currently only one (free, unlimited) tier — see spec.md §6. */
export const WATERMARK = "\n\n---\n*Generated with [SpecForge](https://specforge.app)*\n";

/** Returns the first banned filler phrase found in the text (case-insensitive), or null. */
export function findBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_FILLER_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) return phrase;
  }
  return null;
}

/** Returns any of the required "## Heading" markdown sections missing from the doc. */
export function missingSections(markdown: string, requiredHeadings: string[]): string[] {
  const lower = markdown.toLowerCase();
  return requiredHeadings.filter((heading) => !lower.includes(heading.toLowerCase()));
}

export function formatBriefForPrompt(brief: Brief): string {
  const features = brief.features.map((f) => `- [${f.priority}] ${f.name}: ${f.description}`).join("\n");
  const entities = brief.dataEntities.map((e) => `- ${e.name}: ${e.fields.join(", ")}`).join("\n");
  const nonGoals = brief.nonGoals.map((g) => `- ${g}`).join("\n");

  return `Project brief (single source of truth — stay consistent with these exact names):
Name: ${brief.name}
Elevator pitch: ${brief.elevatorPitch}
Target users: ${brief.targetUsers}
Platform: ${brief.platform}
Auth model: ${brief.authModel}
Monetization: ${brief.monetization}

Features:
${features}

Data entities:
${entities}

Non-goals:
${nonGoals}`;
}

export type DocErrorCode = "LLM_FAILURE" | "EMPTY_CONTENT";

export class DocError extends Error {
  code: DocErrorCode;
  cause?: unknown;

  constructor(message: string, code: DocErrorCode, cause?: unknown) {
    super(message);
    this.name = "DocError";
    this.code = code;
    this.cause = cause;
  }
}

export interface DocResult {
  content: string;
  model: string;
  usedFallback: boolean;
  /** Structural issues (missing sections / banned phrases) found even after the retry. Empty if clean. */
  warnings: string[];
}
