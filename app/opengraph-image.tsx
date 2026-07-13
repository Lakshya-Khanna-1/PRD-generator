import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SpecForge — Turn your app idea into agent-ready specs";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0c0a09",
          backgroundImage: "radial-gradient(circle at 75% 20%, rgba(255,106,61,0.25), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700, color: "#f5f1ea" }}>
          Spec<span style={{ color: "#ff6a3d" }}>Forge</span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 40,
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f1ea",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          <span>Turn your app idea into </span>
          <span style={{ color: "#ff6a3d", fontStyle: "italic" }}>agent-ready</span>
          <span>&nbsp;specs.</span>
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 28, color: "#a8a095", maxWidth: 820 }}>
          spec.md · tasks.md · agents.md — ready for Cursor, Claude Code, and Codex.
        </div>
      </div>
    ),
    { ...size }
  );
}
