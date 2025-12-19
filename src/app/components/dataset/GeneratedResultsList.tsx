// Move to: dataset/GeneratedResultsList.tsx
import React from "react";

type GeneratedResult = {
  combo: number;
  inputs: Record<string, string>;
  output?: unknown;
  error?: string;
};

type GeneratedResultsListProps = {
  generatedResults: GeneratedResult[];
};

export default function GeneratedResultsList({
  generatedResults,
}: GeneratedResultsListProps) {
  if (!generatedResults.length) return null;
  return (
    <div style={{ maxWidth: 900, marginTop: 18 }}>
      <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Generated Results</h3>
      <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {generatedResults.map((r) => (
          <li
            key={r.combo}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 10,
              background: r.error ? "#fef2f2" : "#f0fdf4",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <b>Combo #{r.combo}</b>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              {Object.entries(r.inputs || {})
                .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                .join(", ")}
            </div>
            {r.error ? (
              <div style={{ color: "#b91c1c" }}>{r.error}</div>
            ) : (
              <pre
                style={{
                  marginTop: 6,
                  background: "#e0e7ff",
                  padding: 10,
                  borderRadius: 4,
                }}
              >
                {typeof r.output === "string"
                  ? r.output
                  : JSON.stringify(r.output, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
