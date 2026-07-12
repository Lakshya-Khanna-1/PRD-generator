import { cx } from "@/lib/variants";

export default function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("mx-auto w-full max-w-6xl px-6 sm:px-8", className)} {...props} />;
}
