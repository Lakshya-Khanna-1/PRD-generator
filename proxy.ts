import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

// Burst/abuse guard for expensive LLM-backed routes, not the monthly free-tier
// quota (that's a persistent per-account limit added in Milestone 4).
const GENERATE_RATE_LIMIT = { windowMs: 60_000, max: 5 };

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function proxy(req: NextRequest) {
  const ip = getClientIp(req);
  const result = checkRateLimit(`generate:${ip}`, GENERATE_RATE_LIMIT);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly.", retryAfterSeconds: result.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/generate/:path*",
};
