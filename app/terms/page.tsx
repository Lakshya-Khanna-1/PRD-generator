import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { TERMS_MD } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service | SpecForge" };

export default function TermsPage() {
  return <LegalPage title="Terms of Service" content={TERMS_MD} />;
}
