import * as Sentry from "@sentry/nextjs";

/** Gated on NEXT_PUBLIC_SENTRY_DSN — no-op with nothing configured. */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
