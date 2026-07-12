import { cx } from "@/lib/variants";

export type StepStatus = "pending" | "active" | "complete" | "error";

interface StepperProps {
  steps: { id: string; label: string; status: StepStatus }[];
  className?: string;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
          <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-error/20 text-error">
        <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <span className="absolute size-6 animate-ping rounded-full bg-accent/40" />
        <span className="relative size-2.5 rounded-full bg-accent" />
      </span>
    );
  }
  return <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border" />;
}

export default function Stepper({ steps, className }: StepperProps) {
  return (
    <ol className={cx("flex flex-col gap-1", className)}>
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <span className={cx("my-1 w-px flex-1 min-h-4", step.status === "complete" ? "bg-accent" : "bg-border")} />
            )}
          </div>
          <span
            className={cx(
              "pb-4 text-sm font-medium",
              step.status === "pending" ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
