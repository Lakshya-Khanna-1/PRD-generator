import Link from "next/link";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import MarkdownDoc from "@/components/docs/MarkdownDoc";
import { EXAMPLE_SPEC_MD } from "@/lib/exampleDoc";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />
      <Container className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Built for Cursor · Claude Code · Codex
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Turn your app idea into <span className="italic text-accent">agent-ready</span> specs.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Describe what you want to build. SpecForge asks the right clarifying questions, then generates a
            complete <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-base text-accent">spec.md</code>,{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-base text-accent">tasks.md</code>, and{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-base text-accent">agents.md</code> your
            coding agent can build from immediately.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/create" className={buttonClasses("primary", "md")}>
              Generate my specs
              <svg viewBox="0 0 16 16" fill="none" className="size-4">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="text-sm text-muted-foreground">No signup. Free tier included.</span>
          </div>
        </div>

        <Card className="max-h-[440px] overflow-y-auto p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <span className="size-2.5 rounded-full bg-error/70" />
            <span className="size-2.5 rounded-full bg-accent/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">spec.md — PlantPal</span>
          </div>
          <MarkdownDoc content={EXAMPLE_SPEC_MD} className="text-sm" />
        </Card>
      </Container>
    </section>
  );
}
