import { notFound } from "next/navigation";
import PipelineTestClient from "@/components/dev/PipelineTestClient";

export default function PipelineTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <PipelineTestClient />;
}
