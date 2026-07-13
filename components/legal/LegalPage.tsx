import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import MarkdownDoc from "@/components/docs/MarkdownDoc";

export default function LegalPage({ title, content }: { title: string; content: string }) {
  return (
    <>
      <Header />
      <main>
        <Container className="max-w-3xl py-16 sm:py-24">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <Card className="mt-8 p-6 sm:p-8">
            <MarkdownDoc content={content} />
          </Card>
        </Container>
      </main>
      <Footer />
    </>
  );
}
