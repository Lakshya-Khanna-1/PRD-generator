import { notFound } from "next/navigation";
import ClarifyTestClient from "@/components/dev/ClarifyTestClient";

export default function ClarifyTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ClarifyTestClient />;
}
