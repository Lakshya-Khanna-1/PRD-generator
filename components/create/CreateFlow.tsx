"use client";

import { useState } from "react";
import FlowProgress from "@/components/create/FlowProgress";
import IdeaStep from "@/components/create/IdeaStep";
import ClarifyStep from "@/components/create/ClarifyStep";
import GenerateStep from "@/components/create/GenerateStep";
import ReviewStep from "@/components/create/ReviewStep";
import type { ClarifyQuestion, ClarifyAnswer, FinalDocs, FlowStep } from "@/components/create/types";

export default function CreateFlow() {
  const [step, setStep] = useState<FlowStep>("idea");
  const [idea, setIdea] = useState("");
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [answerMap, setAnswerMap] = useState<Record<string, string | null>>({});
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [finalDocs, setFinalDocs] = useState<FinalDocs | null>(null);

  async function handleIdeaSubmit() {
    setIdeaLoading(true);
    setIdeaError(null);
    try {
      const res = await fetch("/api/generate/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Could not generate questions (${res.status})`);
      }
      const data = await res.json();
      const nextQuestions: ClarifyQuestion[] = data.questions;
      setQuestions(nextQuestions);
      setAnswerMap(Object.fromEntries(nextQuestions.map((q) => [q.id, null])));
      setStep("clarify");
    } catch (err) {
      setIdeaError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIdeaLoading(false);
    }
  }

  function handleClarifySubmit() {
    setGenerateError(null);
    setStep("generate");
  }

  function buildAnswers(): ClarifyAnswer[] {
    return questions.map((q) => ({ questionId: q.id, question: q.question, answer: answerMap[q.id] ?? null }));
  }

  return (
    <>
      <FlowProgress current={step} />

      {step === "idea" && (
        <IdeaStep idea={idea} onChangeIdea={setIdea} onSubmit={handleIdeaSubmit} loading={ideaLoading} error={ideaError} />
      )}

      {step === "clarify" && (
        <ClarifyStep
          questions={questions}
          answers={answerMap}
          onSetAnswer={(id, value) => setAnswerMap((prev) => ({ ...prev, [id]: value }))}
          onSubmit={handleClarifySubmit}
          onBack={() => setStep("idea")}
          loading={false}
          error={null}
        />
      )}

      {step === "generate" && (
        <>
          <GenerateStep
            key={retryToken}
            idea={idea}
            answers={buildAnswers()}
            onComplete={(docs) => {
              setFinalDocs(docs);
              setStep("review");
            }}
            onError={setGenerateError}
            onRetry={() => setRetryToken((t) => t + 1)}
          />
          {generateError && (
            <div className="mx-auto max-w-4xl px-6 pb-16 sm:px-8">
              <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {generateError}
              </p>
            </div>
          )}
        </>
      )}

      {step === "review" && finalDocs && (
        <ReviewStep
          docs={finalDocs}
          onStartOver={() => {
            setIdea("");
            setQuestions([]);
            setAnswerMap({});
            setFinalDocs(null);
            setGenerateError(null);
            setStep("idea");
          }}
        />
      )}
    </>
  );
}
