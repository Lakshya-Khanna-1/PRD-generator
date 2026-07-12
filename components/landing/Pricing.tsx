import Link from "next/link";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

const FREE_FEATURES = ["3 generations / month", "spec.md, tasks.md, agents.md", "Full streaming generation", "SpecForge watermark line"];

const PRO_FEATURES = [
  "Everything in Free, unlimited",
  "Higher-quality model + critique pass",
  "Extras: data-model.md, user-stories.md",
  "CLAUDE.md / .cursorrules variant",
  "No watermark",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <Container>
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade only when you&apos;re shipping for real.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col p-8">
            <h3 className="font-display text-xl font-semibold text-foreground">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">For trying out an idea.</p>
            <p className="mt-6 font-display text-4xl font-semibold text-foreground">$0</p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            <Link href="/create" className={buttonClasses("secondary", "md", "mt-8")}>
              Generate my specs
            </Link>
          </Card>

          <Card className="relative flex flex-col border-accent/40 p-8">
            <Badge tone="accent" className="absolute right-6 top-6">
              Coming soon
            </Badge>
            <h3 className="font-display text-xl font-semibold text-foreground">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">Credit packs for serious builds.</p>
            <p className="mt-6 font-display text-4xl font-semibold text-foreground">
              Credit packs<span className="ml-2 text-base font-normal text-muted-foreground">from $9</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            <button type="button" disabled className={buttonClasses("primary", "md", "mt-8")}>
              Coming in a future update
            </button>
          </Card>
        </div>
      </Container>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 size-4 shrink-0 text-accent">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
