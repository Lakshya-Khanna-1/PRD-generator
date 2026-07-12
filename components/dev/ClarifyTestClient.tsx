"use client";

import { useState } from "react";

export default function ClarifyTestClient() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setStatus(null);
    try {
      const res = await fetch("/api/generate/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      setStatus(res.status);
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setResult(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", fontFamily: "monospace" }}>
      <h1>Dev: /api/generate/clarify tester</h1>
      <p>Dev-only page. Not linked from the app, and 404s in production builds.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={6}
          placeholder="Describe an app idea (min 20 characters)..."
          style={{ padding: "0.5rem", fontFamily: "monospace" }}
        />
        <button type="submit" disabled={loading || idea.trim().length < 20}>
          {loading ? "Calling clarify endpoint..." : "Submit"}
        </button>
      </form>
      {status !== null && <p>HTTP status: {status}</p>}
      {result && (
        <pre style={{ background: "#111", color: "#0f0", padding: "1rem", overflowX: "auto", whiteSpace: "pre-wrap" }}>
          {result}
        </pre>
      )}
    </main>
  );
}
