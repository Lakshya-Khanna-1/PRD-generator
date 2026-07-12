import "server-only";
import { callLlm, LlmError, type LlmMessage } from "@/lib/llm";

export const MIN_IDEA_LENGTH = 20;

export interface ClarifyQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "short_answer";
  options: string[];
}

export interface ClarifyResult {
  questions: ClarifyQuestion[];
  model: string;
  usedFallback: boolean;
}

export type ClarifyErrorCode = "INVALID_JSON" | "INVALID_SHAPE" | "LLM_FAILURE";

export class ClarifyError extends Error {
  code: ClarifyErrorCode;
  cause?: unknown;

  constructor(message: string, code: ClarifyErrorCode, cause?: unknown) {
    super(message);
    this.name = "ClarifyError";
    this.code = code;
    this.cause = cause;
  }
}

const SYSTEM_PROMPT = `You are SpecForge's requirements analyst. Given a raw app idea from a founder, produce 4 to 6 targeted clarification questions whose answers let you later write a complete, unambiguous product spec.

Rules:
- Cover whichever of these topics the raw idea leaves unclear: target users, platform (web/mobile/desktop), auth model, data storage/entities, monetization, must-have features/scope. Skip a topic only if the idea already states it clearly.
- Each question has "type" of either "multiple_choice" (2-5 concrete, mutually exclusive "options") or "short_answer" ("options" must be an empty array).
- Multiple-choice options must be concrete and specific, e.g. "Stripe subscription" not "some kind of payment", "Google + email/password" not "standard auth".
- Never use vague filler words in a question or option: "user-friendly", "scalable", "seamless", "robust", "intuitive", "cutting-edge", "state-of-the-art", "next-generation".
- Do not ask about something the raw idea already answers clearly.
- "id" is a short snake_case identifier for the question topic (e.g. "target_users", "monetization").

Output ONLY a single JSON object matching this exact schema — no prose, no markdown fences, nothing before or after it:
{"questions": [{"id": "string", "question": "string", "type": "multiple_choice" | "short_answer", "options": ["string", ...]}]}`;

function buildUserPrompt(rawIdea: string): string {
  return `Raw app idea:\n"""\n${rawIdea.trim()}\n"""\n\nReturn the clarification questions now as JSON matching the schema exactly.`;
}

function isClarifyQuestion(value: unknown): value is ClarifyQuestion {
  if (typeof value !== "object" || value === null) return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    q.id.length > 0 &&
    typeof q.question === "string" &&
    q.question.length > 0 &&
    (q.type === "multiple_choice" || q.type === "short_answer") &&
    Array.isArray(q.options) &&
    q.options.every((o) => typeof o === "string") &&
    (q.type === "short_answer" || q.options.length >= 2)
  );
}

function parseClarifyResponse(raw: string): ClarifyQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ClarifyError("Model did not return valid JSON", "INVALID_JSON", err);
  }

  const questions = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown> | null)?.questions;

  if (!Array.isArray(questions) || questions.length < 4 || questions.length > 6 || !questions.every(isClarifyQuestion)) {
    throw new ClarifyError("Model JSON did not match the expected clarify schema", "INVALID_SHAPE");
  }

  return questions;
}

/** Raw idea -> 4-6 clarification questions. Assumes the caller already validated idea length. */
export async function generateClarifyQuestions(rawIdea: string): Promise<ClarifyResult> {
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(rawIdea) },
  ];

  let llmResult;
  try {
    llmResult = await callLlm({ tier: "free", jsonMode: true, messages });
  } catch (err) {
    const message = err instanceof LlmError ? err.message : "LLM call failed";
    throw new ClarifyError(message, "LLM_FAILURE", err);
  }

  const questions = parseClarifyResponse(llmResult.content);
  return { questions, model: llmResult.model, usedFallback: llmResult.usedFallback };
}
