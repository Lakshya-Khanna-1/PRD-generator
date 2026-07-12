import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BriefSchema } from "@/lib/brief";
import { generateSpecDoc } from "@/lib/docs/spec";
import { generateTasksDoc } from "@/lib/docs/tasksDoc";
import { generateAgentsDoc } from "@/lib/docs/agentsDoc";
import { DocError } from "@/lib/docs/shared";

const RequestSchema = z.object({
  docType: z.enum(["spec", "tasks", "agents"]),
  brief: BriefSchema,
  /** Required for "tasks" and "agents" — both are generated from the current spec.md content. */
  specMd: z.string().min(1).optional(),
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

  const { docType, brief, specMd } = parsed.data;

  if ((docType === "tasks" || docType === "agents") && !specMd) {
    return NextResponse.json({ error: `"specMd" is required to regenerate ${docType}.md` }, { status: 400 });
  }

  try {
    const result =
      docType === "spec"
        ? await generateSpecDoc(brief)
        : docType === "tasks"
          ? await generateTasksDoc(brief, specMd!)
          : await generateAgentsDoc(brief, specMd!);

    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof DocError ? err.code : "UNKNOWN";
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error(`regenerate "${docType}" failed`, { code, message });
    return NextResponse.json({ error: "Failed to regenerate document", code }, { status: 502 });
  }
}
