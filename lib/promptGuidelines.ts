/** Shared rules injected into every generation prompt (spec.md §4 prompt requirements). */

export const BANNED_FILLER_PHRASES = [
  "user-friendly",
  "scalable",
  "seamless",
  "robust",
  "intuitive",
  "cutting-edge",
  "state-of-the-art",
  "next-generation",
  "innovative",
  "world-class",
  "best-in-class",
  "leverage",
];

export const EDGE_CASE_CHECKLIST = [
  "auth failures (expired session, wrong password, locked/banned account)",
  "empty states (no data yet, first-time user, zero search results)",
  "permissions (unauthorized access attempts, cross-account access)",
  "deletion flows (soft vs hard delete, confirmation step, cascading effects on related data)",
];

export function bannedPhrasesRule(): string {
  return `Never use these vague filler phrases: ${BANNED_FILLER_PHRASES.map((p) => `"${p}"`).join(", ")}. Every claim must be concrete and specific instead.`;
}

export function edgeCaseChecklistRule(): string {
  return `You must explicitly address each of these edge-case categories somewhere in the output:\n${EDGE_CASE_CHECKLIST.map((c) => `- ${c}`).join("\n")}`;
}
