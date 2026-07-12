import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

const STEPS = [
  {
    number: "01",
    title: "Describe your idea",
    body: "One textarea. Write it however it comes to mind — vague, detailed, or somewhere in between.",
  },
  {
    number: "02",
    title: "Answer a few questions",
    body: "SpecForge asks 4-6 targeted questions about users, platform, auth, and monetization. Skip any and let AI decide.",
  },
  {
    number: "03",
    title: "Download your specs",
    body: "Watch spec.md, tasks.md, and agents.md get written live, then download a zip ready to drop into your coding agent.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <Container>
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">Three steps, about four minutes, one working zip.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.number} className="p-6">
              <span className="font-display text-3xl font-semibold text-accent">{step.number}</span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
