import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

// Source-map upload disabled so the build never needs a SENTRY_AUTH_TOKEN —
// error capture (instrumentation.ts / instrumentation-client.ts) works
// without it; source maps can be turned on later once a real Sentry project exists.
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
});
