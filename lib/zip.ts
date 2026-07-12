import "server-only";
import JSZip from "jszip";

export interface SpecDocs {
  agentsMd: string;
  specMd: string;
  tasksMd: string;
}

export async function buildSpecsZip(docs: SpecDocs): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("agents.md", docs.agentsMd);
  zip.file("spec.md", docs.specMd);
  zip.file("tasks.md", docs.tasksMd);
  return zip.generateAsync({ type: "nodebuffer" });
}
