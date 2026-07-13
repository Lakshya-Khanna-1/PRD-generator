import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { PRIVACY_MD } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy | SpecForge" };

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" content={PRIVACY_MD} />;
}
