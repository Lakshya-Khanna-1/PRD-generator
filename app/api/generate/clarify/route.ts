import { NextRequest, NextResponse } from "next/server";
import { generateClarifyQuestions, ClarifyError, MIN_IDEA_LENGTH } from "@/lib/clarify";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const idea = (body as Record<string, unknown> | null)?.idea;
  if (typeof idea !== "string" || idea.trim().length < MIN_IDEA_LENGTH) {
    return NextResponse.json(
      { error: `Field "idea" must be a string of at least ${MIN_IDEA_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    const result = await generateClarifyQuestions(idea);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ClarifyError) {
      console.error("clarify generation failed", { code: err.code, message: err.message });
      return NextResponse.json({ error: "Failed to generate clarification questions", code: err.code }, { status: 502 });
    }
    console.error("unexpected error in /api/generate/clarify", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
