import "server-only";
import { z } from "zod";
import { callLlm, LlmError, type LlmMessage } from "@/lib/llm";
import { bannedPhrasesRule } from "@/lib/promptGuidelines";

export interface ClarifyAnswer {
  questionId: string;
  question: string;
  /** null means the user chose "let AI decide". */
  answer: string | null;
}

export const BriefSchema = z.object({
  name: z.string().min(1),
  elevatorPitch: z.string().min(1),
  targetUsers: z.string().min(1),
  platform: z.string().min(1),
  authModel: z.string().min(1),
  monetization: z.string().min(1),
  features: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        priority: z.enum(["must-have", "nice-to-have"]),
      })
    )
    .min(1),
  dataEntities: z
    .array(
      z.object({
        name: z.string().min(1),
        fields: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  nonGoals: z.array(z.string().min(1)).min(1),
});

export type Brief = z.infer<typeof BriefSchema>;

export interface BriefResult {
  brief: Brief;
  model: string;
  usedFallback: boolean;
}

export type BriefErrorCode = "LLM_FAILURE" | "INVALID_JSON" | "INVALID_SHAPE";

export class BriefError extends Error {
  code: BriefErrorCode;
  cause?: unknown;

  constructor(message: string, code: BriefErrorCode, cause?: unknown) {
    super(message);
    this.name = "BriefError";
    this.code = code;
    this.cause = cause;
  }
}

const SYSTEM_PROMPT = `You are SpecForge's product analyst. Given a raw app idea and the founder's answers to clarification questions, produce ONE structured JSON brief that will be the single source of truth for every downstream spec document.

Rules:
- Every field must be concrete and specific. Real feature names, real screen names, real entity field names — never placeholders like "appropriate features" or "relevant data".
- "features" must list every must-have feature implied by the idea/answers, each with a short specific "name", one-sentence "description", and "priority" of "must-have" or "nice-to-have".
- "dataEntities" must list the real data entities the app needs (e.g. "User", "Invoice", "Plant"), each with concrete field names (e.g. ["email", "passwordHash", "createdAt"]), not "appropriate database tables".
- "nonGoals" lists at least 2 things this v1 explicitly will NOT do, to keep scope bounded.
- Where the founder answered "let AI decide" (answer is null) or skipped a topic, make a concrete, reasonable decision yourself — never leave a field vague because the founder didn't specify.
- ${bannedPhrasesRule()}

Output ONLY a single JSON object matching this exact schema — no prose, no markdown fences:
{
  "name": "string",
  "elevatorPitch": "string (one sentence)",
  "targetUsers": "string",
  "platform": "string",
  "authModel": "string",
  "monetization": "string",
  "features": [{"name": "string", "description": "string", "priority": "must-have" | "nice-to-have"}],
  "dataEntities": [{"name": "string", "fields": ["string", ...]}],
  "nonGoals": ["string", ...]
}`;

function buildUserPrompt(rawIdea: string, answers: ClarifyAnswer[]): string {
  const answerLines = answers
    .map((a) => `- ${a.question}\n  Answer: ${a.answer ?? "(founder skipped — you decide)"}`)
    .join("\n");

  return `Raw app idea:\n"""\n${rawIdea.trim()}\n"""\n\nClarification Q&A:\n${answerLines || "(no clarification answers provided — infer everything from the raw idea)"}\n\nReturn the brief now as JSON matching the schema exactly.`;
}

function parseBrief(raw: string): Brief {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new BriefError("Model did not return valid JSON", "INVALID_JSON", err);
  }

  const result = BriefSchema.safeParse(parsed);
  if (!result.success) {
    throw new BriefError(`Model JSON did not match the brief schema: ${result.error.message}`, "INVALID_SHAPE", result.error);
  }

  return result.data;
}

async function requestBrief(rawIdea: string, answers: ClarifyAnswer[]) {
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(rawIdea, answers) },
  ];

  try {
    return await callLlm({ tier: "free", jsonMode: true, messages, maxTokens: 3000 });
  } catch (err) {
    const message = err instanceof LlmError ? err.message : "LLM call failed";
    throw new BriefError(message, "LLM_FAILURE", err);
  }
}

/** Raw idea + clarify answers -> structured Brief. Retries the LLM call once if the JSON is invalid/malformed. */
export async function generateBrief(rawIdea: string, answers: ClarifyAnswer[]): Promise<BriefResult> {
  const llmResult = await requestBrief(rawIdea, answers);

  try {
    const brief = parseBrief(llmResult.content);
    return { brief, model: llmResult.model, usedFallback: llmResult.usedFallback };
  } catch {
    const retryResult = await requestBrief(rawIdea, answers);
    const brief = parseBrief(retryResult.content);
    return { brief, model: retryResult.model, usedFallback: retryResult.usedFallback };
  }
}
