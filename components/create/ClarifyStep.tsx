"use client";

import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cx } from "@/lib/variants";
import type { ClarifyQuestion } from "@/components/create/types";

interface ClarifyStepProps {
  questions: ClarifyQuestion[];
  answers: Record<string, string | null>;
  onSetAnswer: (questionId: string, answer: string | null) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export default function ClarifyStep({ questions, answers, onSetAnswer, onSubmit, onBack, loading, error }: ClarifyStepProps) {
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a !== null && a !== undefined && a.trim() !== "";
  }).length;

  return (
    <Container className="max-w-2xl py-16 sm:py-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A few quick questions
          </h1>
          <p className="mt-3 text-muted-foreground">
            Skip anything you&apos;re not sure about — SpecForge will make a sensible decision for you.
          </p>
        </div>
        <Badge tone="accent" className="hidden shrink-0 sm:inline-flex">
          {answeredCount} / {questions.length} answered
        </Badge>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} value={answers[q.id] ?? null} onChange={(v) => onSetAnswer(q.id, v)} />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? "Generating..." : "Generate my specs"}
        </Button>
      </div>
    </Container>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: ClarifyQuestion;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const skipped = value === null;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">{question.question}</h2>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cx(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            skipped ? "bg-accent-soft text-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Let AI decide
        </button>
      </div>

      {question.type === "multiple_choice" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.options.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(selected ? null : option)}
                className={cx(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  selected
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          placeholder="Your answer..."
          className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-accent"
        />
      )}
    </Card>
  );
}
