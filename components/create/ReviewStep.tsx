"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import MarkdownDoc from "@/components/docs/MarkdownDoc";
import { slugify } from "@/lib/slugify";
import type { FinalDocs } from "@/components/create/types";

type DocTab = "spec" | "tasks" | "agents";

const TABS: { id: DocTab; label: string; filename: string }[] = [
  { id: "spec", label: "spec.md", filename: "spec.md" },
  { id: "tasks", label: "tasks.md", filename: "tasks.md" },
  { id: "agents", label: "agents.md", filename: "agents.md" },
];

export default function ReviewStep({ docs, onStartOver }: { docs: FinalDocs; onStartOver: () => void }) {
  const [content, setContent] = useState({
    spec: docs.specMarkdown,
    tasks: docs.tasksMarkdown,
    agents: docs.agentsMarkdown,
  });
  const [activeTab, setActiveTab] = useState<DocTab>("spec");
  const [regenerating, setRegenerating] = useState<DocTab | null>(null);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleRegenerate(tab: DocTab) {
    setRegenerating(tab);
    setRegenerateError(null);
    try {
      const res = await fetch("/api/generate/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: tab, brief: docs.brief, specMd: content.spec }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Regeneration failed (${res.status})`);
      }
      const data = await res.json();
      setContent((prev) => ({ ...prev, [tab]: data.content }));
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : "Regeneration failed. Please try again.");
    } finally {
      setRegenerating(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/generate/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docs.brief.name,
          agentsMd: content.agents,
          specMd: content.spec,
          tasksMd: content.tasks,
        }),
      });
      if (!res.ok) throw new Error("Zip download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(docs.brief.name)}-specs.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setRegenerateError("Could not build the zip. Please try downloading again.");
    } finally {
      setDownloading(false);
    }
  }

  const isRegenerating = regenerating === activeTab;

  return (
    <Container className="max-w-4xl py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {docs.brief.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{docs.brief.elevatorPitch}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onStartOver}>
          Start over
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as DocTab)} />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRegenerate(activeTab)} disabled={isRegenerating}>
            {isRegenerating ? "Regenerating..." : "Regenerate this doc"}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Zipping..." : "Download zip"}
          </Button>
        </div>
      </div>

      {activeTab === "spec" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Regenerating spec.md won&apos;t automatically update tasks.md or agents.md.
        </p>
      )}
      {regenerateError && (
        <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {regenerateError}
        </p>
      )}

      <Card className="mt-6 p-6 sm:p-8">
        {isRegenerating ? (
          <div className="flex h-40 items-center justify-center">
            <span className="font-mono text-sm text-muted-foreground">Rewriting {TABS.find((t) => t.id === activeTab)?.filename}...</span>
          </div>
        ) : (
          <MarkdownDoc content={content[activeTab]} />
        )}
      </Card>
    </Container>
  );
}
