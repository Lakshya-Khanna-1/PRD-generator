import { NextRequest } from "next/server";
import { z } from "zod";
import { generateBrief, BriefError, type ClarifyAnswer } from "@/lib/brief";
import { generateSpecDoc } from "@/lib/docs/spec";
import { generateTasksDoc } from "@/lib/docs/tasksDoc";
import { generateAgentsDoc } from "@/lib/docs/agentsDoc";
import { DocError } from "@/lib/docs/shared";
import { MIN_IDEA_LENGTH } from "@/lib/clarify";
import { sseEvent } from "@/lib/sse";

const RequestSchema = z.object({
  idea: z.string().min(MIN_IDEA_LENGTH),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        question: z.string(),
        answer: z.string().nullable(),
      })
    )
    .default([]),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Request body must be valid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request body", details: parsed.error.issues }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { idea, answers } = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // enqueue/close can throw if the client already disconnected (e.g. navigated away
      // mid-stream) and the runtime closed the controller out from under us — safe to ignore.
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        } catch {
          // no listener left; nothing to do
        }
      };

      function stageError(stage: string, err: unknown) {
        const code = err instanceof BriefError || err instanceof DocError ? err.code : "UNKNOWN";
        const message = err instanceof Error ? err.message : "Unexpected error";
        console.error(`pipeline stage "${stage}" failed`, { code, message });
        send("stage", { stage, status: "error", code, message });
      }

      try {
        send("stage", { stage: "brief", status: "start" });
        let briefResult;
        try {
          briefResult = await generateBrief(idea, answers as ClarifyAnswer[]);
        } catch (err) {
          stageError("brief", err);
          return;
        }
        send("stage", { stage: "brief", status: "complete", data: briefResult.brief, model: briefResult.model, usedFallback: briefResult.usedFallback });

        send("stage", { stage: "spec", status: "start" });
        let specResult;
        try {
          specResult = await generateSpecDoc(briefResult.brief, {
            onChunk: (delta) => send("chunk", { stage: "spec", delta }),
            onRetry: () => send("stage", { stage: "spec", status: "restart" }),
          });
        } catch (err) {
          stageError("spec", err);
          return;
        }
        send("stage", {
          stage: "spec",
          status: "complete",
          content: specResult.content,
          warnings: specResult.warnings,
          model: specResult.model,
          usedFallback: specResult.usedFallback,
        });

        send("stage", { stage: "tasks", status: "start" });
        let tasksResult;
        try {
          tasksResult = await generateTasksDoc(briefResult.brief, specResult.content, {
            onChunk: (delta) => send("chunk", { stage: "tasks", delta }),
            onRetry: () => send("stage", { stage: "tasks", status: "restart" }),
          });
        } catch (err) {
          stageError("tasks", err);
          return;
        }
        send("stage", {
          stage: "tasks",
          status: "complete",
          content: tasksResult.content,
          warnings: tasksResult.warnings,
          model: tasksResult.model,
          usedFallback: tasksResult.usedFallback,
        });

        send("stage", { stage: "agents", status: "start" });
        let agentsResult;
        try {
          agentsResult = await generateAgentsDoc(briefResult.brief, specResult.content, {
            onChunk: (delta) => send("chunk", { stage: "agents", delta }),
            onRetry: () => send("stage", { stage: "agents", status: "restart" }),
          });
        } catch (err) {
          stageError("agents", err);
          return;
        }
        send("stage", {
          stage: "agents",
          status: "complete",
          content: agentsResult.content,
          warnings: agentsResult.warnings,
          model: agentsResult.model,
          usedFallback: agentsResult.usedFallback,
        });

        send("stage", {
          stage: "done",
          status: "complete",
          brief: briefResult.brief,
          specMarkdown: specResult.content,
          tasksMarkdown: tasksResult.content,
          agentsMarkdown: agentsResult.content,
        });
      } catch (err) {
        stageError("pipeline", err);
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
