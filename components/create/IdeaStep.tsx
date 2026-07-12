"use client";

import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import TextArea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import { MIN_IDEA_LENGTH } from "@/lib/constants";

const PLACEHOLDER = `e.g. An app for apartment renters to track watering schedules for their houseplants. You photograph a plant, it identifies the species and suggests a watering interval, and sends a reminder when it's due.`;

interface IdeaStepProps {
  idea: string;
  onChangeIdea: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function IdeaStep({ idea, onChangeIdea, onSubmit, loading, error }: IdeaStepProps) {
  const tooShort = idea.trim().length < MIN_IDEA_LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort || loading) return;
    onSubmit();
  }

  return (
    <Container className="max-w-2xl py-16 sm:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        What are you building?
      </h1>
      <p className="mt-3 text-muted-foreground">
        Describe your app idea in your own words. The more specific, the better — but vague is fine too, SpecForge
        will ask you a few questions next.
      </p>

      <Card className="mt-8 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextArea
            value={idea}
            onChange={(e) => onChangeIdea(e.target.value)}
            rows={7}
            placeholder={PLACEHOLDER}
            aria-label="Describe the app you want to build"
            autoFocus
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              {idea.trim().length < MIN_IDEA_LENGTH
                ? `${MIN_IDEA_LENGTH - idea.trim().length} more characters needed`
                : `${idea.trim().length} characters`}
            </span>
            <Button type="submit" disabled={tooShort || loading}>
              {loading ? "Thinking..." : "Continue"}
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </Container>
  );
}
