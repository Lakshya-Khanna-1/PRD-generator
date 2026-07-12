export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">SpecForge</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Landing page design lands in Milestone 3. This placeholder exists so Milestone 1 can verify the LLM
        wrapper and API routes without depending on unstarted UI work.
      </p>
    </main>
  );
}
