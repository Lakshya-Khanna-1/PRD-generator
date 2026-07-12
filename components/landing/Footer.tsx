import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="font-display text-base font-semibold text-foreground">
          Spec<span className="text-accent">Forge</span>
        </Link>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SpecForge. Turn ideas into agent-ready specs.</p>
      </Container>
    </footer>
  );
}
