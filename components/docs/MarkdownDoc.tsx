import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "@/lib/variants";

export default function MarkdownDoc({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cx("font-sans text-[15px] leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="mb-4 mt-8 font-display text-3xl font-semibold text-foreground first:mt-0" {...props} />,
          h2: (props) => (
            <h2
              className="mb-3 mt-8 border-b border-border pb-2 font-display text-xl font-semibold text-foreground first:mt-0"
              {...props}
            />
          ),
          h3: (props) => <h3 className="mb-2 mt-6 text-base font-semibold text-foreground" {...props} />,
          p: (props) => <p className="mb-4 text-muted-foreground [&>strong]:text-foreground" {...props} />,
          ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-muted-foreground marker:text-accent" {...props} />,
          ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-muted-foreground marker:text-accent" {...props} />,
          li: (props) => <li className="pl-1" {...props} />,
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          code: (props) => (
            <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[13px] text-accent" {...props} />
          ),
          pre: (props) => (
            <pre className="mb-4 overflow-x-auto rounded-xl border border-border bg-surface-hover p-4 font-mono text-[13px]" {...props} />
          ),
          a: (props) => <a className="text-accent underline underline-offset-2 hover:text-accent-hover" {...props} />,
          hr: () => <hr className="my-8 border-border" />,
          table: (props) => (
            <div className="mb-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-sm" {...props} />
            </div>
          ),
          th: (props) => <th className="border-b border-border bg-surface-hover px-3 py-2 font-medium text-foreground" {...props} />,
          td: (props) => <td className="border-b border-border px-3 py-2 text-muted-foreground last:border-b-0" {...props} />,
          input: (props) => <input className="mr-2 accent-accent" disabled {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
