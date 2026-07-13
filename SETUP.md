# SETUP.md — Running & Deploying SpecForge

## 1. Run it locally

**Easiest way (Windows):** double-click `Start-SpecForge.bat` in the project root. It installs dependencies on first run, checks for `.env.local`, starts the dev server, and opens `http://localhost:3000` in your browser automatically.

**Manual way (any OS):**

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Either way, you need a `.env.local` file first (see below) — the app will run, but every generation will fail with `LLM_FAILURE` without a real `OPENROUTER_API_KEY`.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Required? | What it is |
|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | Server-side only, never sent to the browser. Get one at [openrouter.ai/keys](https://openrouter.ai/keys). |
| `DEFAULT_MODEL` | Yes | Free-tier generation model (OpenRouter slug, e.g. `deepseek/deepseek-v4-flash`). |
| `PRO_MODEL` | Yes | Reserved for a future Pro tier — not currently used by any active code path (payments are deferred, see `HANDOVER.md`), but the wrapper expects it to be set. |
| `FALLBACK_MODEL` | Yes | Used automatically if the primary model's provider errors or times out. |
| `SENTRY_DSN` | No | Server-side error tracking. Leave unset and Sentry is a complete no-op. Get a free DSN at [sentry.io](https://sentry.io). |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Same DSN as above, exposed to the browser for client-side error capture. Sentry DSNs aren't secret — this is expected. |
| `NEXT_PUBLIC_SITE_URL` | No | Your production domain, once you have one (e.g. `https://specforge.vercel.app`). Used for correct absolute URLs in Open Graph/social share metadata. Defaults to a placeholder if unset. |

## 3. Deploying to Vercel

This is a standard Next.js App Router project — Vercel is the natural host (Next's own team builds it) and needs no special configuration beyond env vars.

1. **Push your code to GitHub** (already done if you're reading this from the repo — otherwise `git push`).
2. **Go to [vercel.com](https://vercel.com)** and sign in (GitHub login is easiest).
3. **"Add New..." → "Project"**, then import this GitHub repository. Vercel auto-detects Next.js — leave the build settings on their defaults (`npm run build`, output directory auto-detected).
4. **Before the first deploy**, add the environment variables from the table above under **Project Settings → Environment Variables**. At minimum: `OPENROUTER_API_KEY`, `DEFAULT_MODEL`, `PRO_MODEL`, `FALLBACK_MODEL`.
5. **Deploy.** Vercel builds and gives you a `<project>.vercel.app` URL.
6. **Set `NEXT_PUBLIC_SITE_URL`** to that URL (or your custom domain, if you attach one under Project Settings → Domains), then redeploy so Open Graph metadata points at the right place.
7. *(Optional)* Create a free project at [sentry.io](https://sentry.io), copy its DSN into both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`, and redeploy to turn on error tracking.

### A caveat worth knowing before you rely on it

`lib/rateLimit.ts` — the guard that limits generation requests to 5/minute per IP — keeps its counters **in memory**. That's fine for local dev (one process), but Vercel's serverless functions aren't one persistent process: concurrent or cold-started invocations can each get their own memory, so in production the limit effectively becomes "5/minute/IP/instance," not a hard global cap. It's not a launch blocker for a small free tool, but don't treat it as a strict abuse guard under real traffic. The fix, if it ever matters, is swapping in a shared store like Upstash Redis (a couple hours of work, not a rewrite).

## 4. Post-deploy smoke test

Once live, before calling it done:

1. Visit the landing page — confirm it loads and looks right.
2. Go through `/create` end-to-end with a real idea — idea → clarify → generate → review → download zip.
3. Visit `/example`, `/terms`, and `/privacy` — confirm they render.
4. Open browser dev tools and confirm no console errors during the flow.

`HANDOVER.md` has a more thorough post-deploy regression checklist (4 varied test ideas) if you want to be extra sure before sharing the link.
