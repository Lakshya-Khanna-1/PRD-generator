import Link from "next/link";
import Container from "@/components/ui/Container";
import { cx } from "@/lib/variants";
import type { FlowStep } from "@/components/create/types";

const STEPS: { id: FlowStep; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "clarify", label: "Clarify" },
  { id: "generate", label: "Generate" },
  { id: "review", label: "Review" },
];

export default function FlowProgress({ current }: { current: FlowStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0 font-display text-lg font-semibold tracking-tight text-foreground">
          Spec<span className="text-accent">Forge</span>
        </Link>
        <ol className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((step, i) => {
            const state = i < currentIndex ? "complete" : i === currentIndex ? "active" : "pending";
            return (
              <li key={step.id} className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      state === "complete" && "bg-accent text-accent-foreground",
                      state === "active" && "border-2 border-accent text-accent",
                      state === "pending" && "border border-border text-muted-foreground"
                    )}
                  >
                    {state === "complete" ? (
                      <svg viewBox="0 0 16 16" fill="none" className="size-3">
                        <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cx(
                      "hidden text-sm font-medium sm:inline",
                      state === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </Container>
    </header>
  );
}
