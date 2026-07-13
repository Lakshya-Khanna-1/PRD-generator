import Link from "next/link";
import Container from "@/components/ui/Container";

const LINKS = [
  { href: "/example", label: "Example" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="font-display text-base font-semibold text-foreground">
          Spec<span className="text-accent">Forge</span>
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SpecForge. Turn ideas into agent-ready specs.</p>
      </Container>
    </footer>
  );
}
