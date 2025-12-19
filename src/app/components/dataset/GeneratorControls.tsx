// Move to: dataset/GeneratorControls.tsx
import React from "react";

type GeneratorControlsProps = {
  runStatus: string;
  start: () => void;
  pause: () => void;
  restart: () => void;
  currentCombination: number;
  maxCombinations: number;
};

export default function GeneratorControls({
  runStatus,
  start,
  pause,
  restart,
  currentCombination,
  maxCombinations,
}: GeneratorControlsProps) {
  if (maxCombinations === 0) return null;
  return (
    <div style={{ maxWidth: 600, marginTop: 12 }}>
      <button
        onClick={() => {
          if (runStatus === "running") return;
          if (runStatus === "done") restart();
          else start();
        }}
        disabled={runStatus === "running"}
        style={{
          padding: "8px 18px",
          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontWeight: 600,
          cursor: runStatus === "running" ? "not-allowed" : "pointer",
          marginRight: 10,
        }}
      >
        {runStatus === "done"
          ? "Restart"
          : runStatus === "paused"
          ? "Resume"
          : "Start"}
      </button>
      <button
        onClick={() => pause()}
        disabled={runStatus !== "running"}
        style={{
          padding: "8px 18px",
          background: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontWeight: 600,
          cursor: runStatus !== "running" ? "not-allowed" : "pointer",
        }}
      >
        Pause
      </button>
      <div style={{ marginTop: 8, color: "#374151" }}>
        <b>Status:</b> {runStatus}
        {currentCombination > 0 && (
          <>
            | <b>Current:</b> {Math.min(currentCombination, maxCombinations)} /{" "}
            {maxCombinations}
          </>
        )}
      </div>
    </div>
  );
}
