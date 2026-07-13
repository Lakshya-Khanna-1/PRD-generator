"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Fraunces, Inter } from "next/font/google";
import Button from "@/components/ui/Button";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Error</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Something broke.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          That wasn&apos;t supposed to happen. The error has been reported — try again in a moment.
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </body>
    </html>
  );
}
