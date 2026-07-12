import { cx } from "@/lib/variants";

export default function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-2xl border border-border bg-surface", className)} {...props} />;
}
