import type { ClarifyQuestion } from "@/lib/clarify";
import type { ClarifyAnswer, Brief } from "@/lib/brief";

export type { ClarifyQuestion, ClarifyAnswer, Brief };

export type FlowStep = "idea" | "clarify" | "generate" | "review";

export const DOC_STAGES = ["brief", "spec", "tasks", "agents"] as const;
export type DocStage = (typeof DOC_STAGES)[number];

export interface StageState {
  status: "pending" | "start" | "streaming" | "complete" | "error";
  content: string;
  warnings?: string[];
  model?: string;
  usedFallback?: boolean;
  errorMessage?: string;
}

export interface FinalDocs {
  brief: Brief;
  specMarkdown: string;
  tasksMarkdown: string;
  agentsMarkdown: string;
}
