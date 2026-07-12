import { cx } from "@/lib/variants";

export default function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "w-full resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
