import "server-only";

/**
 * Single wrapper for every OpenRouter call in the app.
 * Model names, max_tokens, and pricing tiers live here ONLY — never
 * reference a model slug or hit OpenRouter directly from anywhere else.
 */

export type PricingTier = "free" | "pro";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallLlmParams {
  tier: PricingTier;
  messages: LlmMessage[];
  /** Overrides the tier's default max_tokens if provided. */
  maxTokens?: number;
  /** Ask the model to return a single JSON object (response_format: json_object). */
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface StreamLlmParams {
  tier: PricingTier;
  messages: LlmMessage[];
  maxTokens?: number;
  timeoutMs?: number;
  /** Called with each text delta as it streams in. */
  onChunk: (delta: string) => void;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CallLlmResult {
  content: string;
  /** The model slug that actually served the request (primary or fallback). */
  model: string;
  usedFallback: boolean;
  usage: LlmUsage | null;
}

export type LlmErrorCode = "MISSING_KEY" | "MISSING_MODEL_CONFIG" | "TIMEOUT" | "HTTP_ERROR" | "NO_CONTENT" | "ALL_MODELS_FAILED";

export class LlmError extends Error {
  code: LlmErrorCode;
  cause?: unknown;

  constructor(message: string, code: LlmErrorCode, cause?: unknown) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.cause = cause;
  }
}

interface TierConfig {
  model: string | undefined;
  maxTokens: number;
}

// Pricing tier -> model + default max_tokens. This is the ONLY place
// model slugs are defined for generation calls.
const TIER_CONFIG: Record<PricingTier, TierConfig> = {
  free: { model: process.env.DEFAULT_MODEL, maxTokens: 2000 },
  pro: { model: process.env.PRO_MODEL, maxTokens: 4000 },
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 30_000;

async function requestOpenRouter(params: {
  apiKey: string;
  model: string;
  messages: LlmMessage[];
  maxTokens: number;
  jsonMode: boolean;
  timeoutMs: number;
}): Promise<CallLlmResult> {
  const { apiKey, model, messages, maxTokens, jsonMode, timeoutMs } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://specforge.app",
        "X-Title": "SpecForge",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError(`Request to ${model} timed out after ${timeoutMs}ms`, "TIMEOUT", err);
    }
    throw new LlmError(`Network error calling ${model}`, "HTTP_ERROR", err);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LlmError(`OpenRouter returned ${response.status} for ${model}: ${body.slice(0, 500)}`, "HTTP_ERROR");
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new LlmError(`OpenRouter returned no content for ${model}`, "NO_CONTENT");
  }

  const usage: LlmUsage | null = data?.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      }
    : null;

  return { content, model, usedFallback: false, usage };
}

async function requestOpenRouterStream(params: {
  apiKey: string;
  model: string;
  messages: LlmMessage[];
  maxTokens: number;
  timeoutMs: number;
  onChunk: (delta: string) => void;
}): Promise<CallLlmResult> {
  const { apiKey, model, messages, maxTokens, timeoutMs, onChunk } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://specforge.app",
        "X-Title": "SpecForge",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError(`Request to ${model} timed out after ${timeoutMs}ms`, "TIMEOUT", err);
    }
    throw new LlmError(`Network error calling ${model}`, "HTTP_ERROR", err);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new LlmError(`OpenRouter returned ${response.status} for ${model}: ${body.slice(0, 500)}`, "HTTP_ERROR");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";
  let usage: LlmUsage | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (payload === "[DONE]" || payload === "") continue;

      let json: { choices?: { delta?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = json?.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
      if (json?.usage) {
        usage = {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0,
        };
      }
    }
  }

  if (!fullContent) {
    throw new LlmError(`OpenRouter returned no content for ${model}`, "NO_CONTENT");
  }

  return { content: fullContent, model, usedFallback: false, usage };
}

function logUsage(params: { tier: PricingTier; model: string; usedFallback: boolean; usage: LlmUsage | null }) {
  const { tier, model, usedFallback, usage } = params;
  console.log(
    JSON.stringify({
      event: "llm_call",
      tier,
      model,
      usedFallback,
      promptTokens: usage?.promptTokens ?? null,
      completionTokens: usage?.completionTokens ?? null,
      totalTokens: usage?.totalTokens ?? null,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Call the LLM for the given pricing tier. Tries the tier's configured
 * model first; on any failure (timeout, HTTP error, empty content) it
 * retries once against FALLBACK_MODEL before giving up.
 */
export async function callLlm(params: CallLlmParams): Promise<CallLlmResult> {
  const { tier, messages, maxTokens, jsonMode = false, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LlmError("OPENROUTER_API_KEY is not set", "MISSING_KEY");
  }

  const config = TIER_CONFIG[tier];
  if (!config.model) {
    throw new LlmError(`No model configured for tier "${tier}" (check env vars)`, "MISSING_MODEL_CONFIG");
  }

  const resolvedMaxTokens = maxTokens ?? config.maxTokens;

  try {
    const result = await requestOpenRouter({
      apiKey,
      model: config.model,
      messages,
      maxTokens: resolvedMaxTokens,
      jsonMode,
      timeoutMs,
    });
    logUsage({ tier, model: result.model, usedFallback: false, usage: result.usage });
    return result;
  } catch (primaryError) {
    const fallbackModel = process.env.FALLBACK_MODEL;
    if (!fallbackModel) {
      throw primaryError;
    }

    try {
      const result = await requestOpenRouter({
        apiKey,
        model: fallbackModel,
        messages,
        maxTokens: resolvedMaxTokens,
        jsonMode,
        timeoutMs,
      });
      const fallbackResult = { ...result, usedFallback: true };
      logUsage({ tier, model: fallbackModel, usedFallback: true, usage: fallbackResult.usage });
      return fallbackResult;
    } catch (fallbackError) {
      throw new LlmError(
        `Both primary model (${config.model}) and fallback model (${fallbackModel}) failed for tier "${tier}"`,
        "ALL_MODELS_FAILED",
        { primaryError, fallbackError }
      );
    }
  }
}

/**
 * Streaming variant of callLlm — invokes onChunk with each text delta as it
 * arrives. Falls back to FALLBACK_MODEL only if the primary request fails
 * before any content was streamed to the caller (a mid-stream failure after
 * partial output is surfaced as an error instead, to avoid emitting
 * duplicate/garbled text downstream).
 */
export async function streamLlm(params: StreamLlmParams): Promise<CallLlmResult> {
  const { tier, messages, maxTokens, timeoutMs = DEFAULT_TIMEOUT_MS, onChunk } = params;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LlmError("OPENROUTER_API_KEY is not set", "MISSING_KEY");
  }

  const config = TIER_CONFIG[tier];
  if (!config.model) {
    throw new LlmError(`No model configured for tier "${tier}" (check env vars)`, "MISSING_MODEL_CONFIG");
  }

  const resolvedMaxTokens = maxTokens ?? config.maxTokens;

  let emittedAny = false;
  const trackedOnChunk = (delta: string) => {
    emittedAny = true;
    onChunk(delta);
  };

  try {
    const result = await requestOpenRouterStream({
      apiKey,
      model: config.model,
      messages,
      maxTokens: resolvedMaxTokens,
      timeoutMs,
      onChunk: trackedOnChunk,
    });
    logUsage({ tier, model: result.model, usedFallback: false, usage: result.usage });
    return result;
  } catch (primaryError) {
    const fallbackModel = process.env.FALLBACK_MODEL;
    if (!fallbackModel || emittedAny) {
      throw primaryError;
    }

    try {
      const result = await requestOpenRouterStream({
        apiKey,
        model: fallbackModel,
        messages,
        maxTokens: resolvedMaxTokens,
        timeoutMs,
        onChunk: trackedOnChunk,
      });
      const fallbackResult = { ...result, usedFallback: true };
      logUsage({ tier, model: fallbackModel, usedFallback: true, usage: fallbackResult.usage });
      return fallbackResult;
    } catch (fallbackError) {
      throw new LlmError(
        `Both primary model (${config.model}) and fallback model (${fallbackModel}) failed for tier "${tier}"`,
        "ALL_MODELS_FAILED",
        { primaryError, fallbackError }
      );
    }
  }
}
