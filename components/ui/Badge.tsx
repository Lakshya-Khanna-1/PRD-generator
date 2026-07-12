import { cx } from "@/lib/variants";

export type BadgeTone = "accent" | "neutral" | "success" | "error";

const tones: Record<BadgeTone, string> = {
  accent: "bg-accent-soft text-accent",
  neutral: "bg-surface-hover text-muted-foreground",
  success: "bg-surface-hover text-success",
  error: "bg-surface-hover text-error",
};

export default function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
