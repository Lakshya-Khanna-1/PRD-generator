import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildSpecsZip } from "@/lib/zip";
import { slugify } from "@/lib/slugify";

const RequestSchema = z.object({
  name: z.string().min(1),
  agentsMd: z.string().min(1),
  specMd: z.string().min(1),
  tasksMd: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.issues }, { status: 400 });
  }

  const { name, agentsMd, specMd, tasksMd } = parsed.data;

  let zipBuffer: Buffer;
  try {
    zipBuffer = await buildSpecsZip({ agentsMd, specMd, tasksMd });
  } catch (err) {
    console.error("zip assembly failed", err);
    return NextResponse.json({ error: "Failed to assemble zip" }, { status: 500 });
  }

  const filename = `${slugify(name)}-specs.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
