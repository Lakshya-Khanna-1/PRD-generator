import "server-only";
import { callLlm, streamLlm, LlmError, type LlmMessage } from "@/lib/llm";
import { DocError, type DocResult, findBannedPhrase, missingSections } from "@/lib/docs/shared";

/**
 * Generic markdown-doc generator: calls the LLM, checks the output has the
 * required section headings and no banned filler phrases, and regenerates
 * once (with the specific problems called out) if either check fails.
 */
export async function generateMarkdownDoc(params: {
  systemPrompt: string;
  userPrompt: string;
  requiredHeadings: string[];
  maxTokens?: number;
  /** If provided, streams text deltas as they arrive instead of one blocking call. */
  onChunk?: (delta: string) => void;
  /** Called right before a regeneration attempt, so callers can tell the client to discard the previous partial stream. */
  onRetry?: () => void;
}): Promise<DocResult> {
  const { systemPrompt, userPrompt, requiredHeadings, maxTokens = 3000, onChunk, onRetry } = params;
  const baseMessages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  async function attempt(extraInstruction?: string) {
    const messages = extraInstruction ? [...baseMessages, { role: "user" as const, content: extraInstruction }] : baseMessages;
    try {
      if (onChunk) {
        return await streamLlm({ tier: "free", messages, maxTokens, onChunk });
      }
      return await callLlm({ tier: "free", messages, maxTokens });
    } catch (err) {
      const message = err instanceof LlmError ? err.message : "LLM call failed";
      throw new DocError(message, "LLM_FAILURE", err);
    }
  }

  function issuesFor(content: string): string[] {
    const missing = missingSections(content, requiredHeadings);
    const banned = findBannedPhrase(content);
    return [...missing.map((h) => `missing required section "${h}"`), ...(banned ? [`contains banned filler phrase "${banned}"`] : [])];
  }

  let result = await attempt();
  if (!result.content.trim()) {
    throw new DocError("Model returned empty content", "EMPTY_CONTENT");
  }

  let issues = issuesFor(result.content);
  if (issues.length > 0) {
    onRetry?.();
    result = await attempt(
      `Your previous output had these problems: ${issues.join("; ")}. Regenerate the FULL document, fixing all of them, still following the exact structure required in the system prompt.`
    );
    issues = issuesFor(result.content);
  }

  return { content: result.content, model: result.model, usedFallback: result.usedFallback, warnings: issues };
}
