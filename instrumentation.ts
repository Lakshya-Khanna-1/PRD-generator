import * as Sentry from "@sentry/nextjs";

/**
 * Gated on SENTRY_DSN — with nothing configured, Sentry.init is never
 * called and the app behaves exactly as it did before this file existed.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
