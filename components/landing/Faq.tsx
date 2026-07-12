import Container from "@/components/ui/Container";

const FAQS = [
  {
    q: "What do I actually get?",
    a: "A zip containing spec.md, tasks.md, and agents.md — written specifically for your idea, structured so a coding agent like Cursor, Claude Code, or Codex can build directly from them.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. The free tier works without an account, rate-limited per IP. An account is only needed if you buy Pro credits.",
  },
  {
    q: "Which AI models generate the docs?",
    a: "Free generations use a fast DeepSeek-class model via OpenRouter. Pro generations use a stronger GLM-class model with an extra critique pass.",
  },
  {
    q: "Can I edit the docs afterward?",
    a: "Not in-browser today — regenerate a doc if it's not right, or edit the downloaded markdown files directly once you have them.",
  },
  {
    q: "What happens to the idea I submit?",
    a: "It's sent to the configured model provider to generate your docs and isn't used for anything else. See the privacy policy for full detail.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <Container className="max-w-3xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Frequently asked</h2>
        <div className="mt-10 divide-y divide-border border-t border-border">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground marker:content-none">
                {item.q}
                <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
