"use client";

import { useState } from "react";

interface StageState {
  status: "pending" | "start" | "streaming" | "complete" | "error";
  content: string;
  warnings?: string[];
  model?: string;
  usedFallback?: boolean;
  errorMessage?: string;
}

const STAGES = ["brief", "spec", "tasks", "agents"] as const;
type Stage = (typeof STAGES)[number];

function emptyStages(): Record<Stage, StageState> {
  return {
    brief: { status: "pending", content: "" },
    spec: { status: "pending", content: "" },
    tasks: { status: "pending", content: "" },
    agents: { status: "pending", content: "" },
  };
}

export default function PipelineTestClient() {
  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Record<Stage, StageState>>(emptyStages());
  const [projectName, setProjectName] = useState("");
  const [finalDocs, setFinalDocs] = useState<{ specMarkdown: string; tasksMarkdown: string; agentsMarkdown: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setStages(emptyStages());
    setFinalDocs(null);

    const res = await fetch("/api/generate/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, answers: [] }),
    });

    if (!res.body) {
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
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
          const stage = data.stage as Stage;
          setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "streaming", content: prev[stage].content + data.delta } }));
        } else if (eventName === "stage") {
          const stage = data.stage as Stage | "done";
          if (stage === "done") {
            setFinalDocs({ specMarkdown: data.specMarkdown, tasksMarkdown: data.tasksMarkdown, agentsMarkdown: data.agentsMarkdown });
            setProjectName(data.brief?.name ?? "specforge-project");
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
                content: stage === "brief" ? JSON.stringify(data.data, null, 2) : data.content,
                warnings: data.warnings,
                model: data.model,
                usedFallback: data.usedFallback,
              },
            }));
          } else if (data.status === "error") {
            setStages((prev) => ({ ...prev, [stage]: { ...prev[stage], status: "error", errorMessage: `${data.code}: ${data.message}` } }));
          }
        }
      }
    }

    setRunning(false);
  }

  async function handleDownload() {
    if (!finalDocs) return;
    const res = await fetch("/api/generate/zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        agentsMd: finalDocs.agentsMarkdown,
        specMd: finalDocs.specMarkdown,
        tasksMd: finalDocs.tasksMarkdown,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "specforge-project"}-specs.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", fontFamily: "monospace" }}>
      <h1>Dev: /api/generate/pipeline tester</h1>
      <p>Dev-only page. Not linked from the app, and 404s in production builds.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={4}
          placeholder="Describe an app idea (min 20 characters)..."
          style={{ padding: "0.5rem", fontFamily: "monospace" }}
        />
        <button type="submit" disabled={running || idea.trim().length < 20}>
          {running ? "Running pipeline..." : "Run pipeline"}
        </button>
      </form>

      {STAGES.map((stage) => (
        <div key={stage} style={{ marginTop: "1rem" }}>
          <h3>
            {stage} — {stages[stage].status}
            {stages[stage].model ? ` (${stages[stage].model}${stages[stage].usedFallback ? ", fallback" : ""})` : ""}
          </h3>
          {stages[stage].errorMessage && <p style={{ color: "red" }}>{stages[stage].errorMessage}</p>}
          {stages[stage].warnings && stages[stage].warnings!.length > 0 && (
            <p style={{ color: "orange" }}>Warnings: {stages[stage].warnings!.join("; ")}</p>
          )}
          <pre style={{ background: "#111", color: "#0f0", padding: "1rem", maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {stages[stage].content || "(empty)"}
          </pre>
        </div>
      ))}

      {finalDocs && (
        <button onClick={handleDownload} style={{ marginTop: "1rem" }}>
          Download {projectName || "specforge-project"}-specs.zip
        </button>
      )}
    </main>
  );
}
