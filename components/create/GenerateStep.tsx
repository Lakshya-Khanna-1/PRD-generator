"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Stepper, { type StepStatus } from "@/components/ui/Stepper";
import { DOC_STAGES, type DocStage, type StageState, type FinalDocs, type ClarifyAnswer } from "@/components/create/types";

const STAGE_LABELS: Record<DocStage, string> = {
  brief: "Reading your idea",
  spec: "Writing spec.md",
  tasks: "Writing tasks.md",
  agents: "Writing agents.md",
};

function emptyStages(): Record<DocStage, StageState> {
  return {
    brief: { status: "pending", content: "" },
    spec: { status: "pending", content: "" },
    tasks: { status: "pending", content: "" },
    agents: { status: "pending", content: "" },
  };
}

function toStepStatus(status: StageState["status"]): StepStatus {
  if (status === "complete") return "complete";
  if (status === "error") return "error";
  if (status === "start" || status === "streaming") return "active";
  return "pending";
}

interface GenerateStepProps {
  idea: string;
  answers: ClarifyAnswer[];
  onComplete: (docs: FinalDocs) => void;
  onError: (message: string) => void;
  onRetry: () => void;
}

export default function GenerateStep({ idea, answers, onComplete, onError, onRetry }: GenerateStepProps) {
  const [stages, setStages] = useState<Record<DocStage, StageState>>(emptyStages);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      let res: Response;
      try {
        res = await fetch("/api/generate/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea, answers }),
          signal: controller.signal,
        });
      } catch {
        if (!cancelled) onError("Could not reach the server. Check your connection and try again.");
        return;
      }

      if (!res.body) {
        if (!cancelled) onError("The server did not return a stream. Please try again.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.slice("event:".length).trim();
          const data = JSON.parse(dataLine.slice("data:".length).trim());

          if (eventName === "chunk") {
            const stage = data.stage as DocStage;
            setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "streaming", content: prev[stage].content + data.delta } }));
          } else if (eventName === "stage") {
            const stage = data.stage as DocStage | "done";
            if (stage === "done") {
              onComplete({
                brief: data.brief,
                specMarkdown: data.specMarkdown,
                tasksMarkdown: data.tasksMarkdown,
                agentsMarkdown: data.agentsMarkdown,
              });
              continue;
            }
            if (data.status === "start") {
              setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "start" } }));
            } else if (data.status === "restart") {
              setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "start", content: "" } }));
            } else if (data.status === "complete") {
              setStages((prev) => ({
                ...prev,
                [stage]: {
                  status: "complete",
                  content: stage === "brief" ? "" : data.content,
                  warnings: data.warnings,
                  model: data.model,
                  usedFallback: data.usedFallback,
                },
              }));
            } else if (data.status === "error") {
              setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "error", errorMessage: data.message ?? "Generation failed." } }));
              if (!cancelled) onError(`${STAGE_LABELS[stage as DocStage] ?? stage} failed: ${data.message ?? "unknown error"}`);
            }
          }
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight });
  });

  const activeStage = DOC_STAGES.find((s) => stages[s].status === "start" || stages[s].status === "streaming");
  const errorStage = DOC_STAGES.find((s) => stages[s].status === "error");
  const displayStage = errorStage ?? activeStage ?? [...DOC_STAGES].reverse().find((s) => stages[s].status === "complete");

  return (
    <Container className="max-w-4xl py-16 sm:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Forging your specs
      </h1>
      <p className="mt-3 text-muted-foreground">This usually takes a couple of minutes. Don&apos;t close this tab.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        <Stepper
          steps={DOC_STAGES.map((s) => ({ id: s, label: STAGE_LABELS[s], status: toStepStatus(stages[s].status) }))}
        />

        <Card className="flex h-[420px] flex-col overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            <span className="font-mono text-xs text-muted-foreground">
              {displayStage ? STAGE_LABELS[displayStage] : "Starting..."}
            </span>
          </div>
          <div ref={previewRef} className="flex-1 overflow-y-auto px-5 py-4">
            {displayStage === "brief" || !displayStage ? (
              <p className="font-mono text-sm text-muted-foreground">Analyzing your idea and drafting a plan...</p>
            ) : stages[displayStage].status === "error" ? (
              <p className="font-mono text-sm text-error">{stages[displayStage].errorMessage}</p>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                {stages[displayStage].content}
                {(stages[displayStage].status === "streaming" || stages[displayStage].status === "start") && (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />
                )}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {errorStage && (
        <div className="mt-6 flex justify-end">
          <Button onClick={onRetry}>Try again</Button>
        </div>
      )}
    </Container>
  );
}
