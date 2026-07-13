"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import MarkdownDoc from "@/components/docs/MarkdownDoc";
import { EXAMPLE_SPEC_MD, EXAMPLE_TASKS_MD, EXAMPLE_AGENTS_MD } from "@/lib/exampleDoc";

type DocTab = "spec" | "tasks" | "agents";

const TABS: { id: DocTab; label: string }[] = [
  { id: "spec", label: "spec.md" },
  { id: "tasks", label: "tasks.md" },
  { id: "agents", label: "agents.md" },
];

const CONTENT: Record<DocTab, string> = {
  spec: EXAMPLE_SPEC_MD,
  tasks: EXAMPLE_TASKS_MD,
  agents: EXAMPLE_AGENTS_MD,
};

export default function ExampleTabs() {
  const [activeTab, setActiveTab] = useState<DocTab>("spec");

  return (
    <div>
      <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as DocTab)} />
      <Card className="mt-6 p-6 sm:p-8">
        <MarkdownDoc content={CONTENT[activeTab]} />
      </Card>
    </div>
  );
}
