import React from "react";

type GeneratorControlsProps = {
  runStatus: string;
  start: () => void;
  pause: () => void;
  currentCombination: number;
  maxCombinations: number;
};

export default function GeneratorControls({
  runStatus,
  start,
  pause,
  currentCombination,
  maxCombinations,
}: GeneratorControlsProps) {
  if (maxCombinations === 0) return null;
  return (
    <div style={{ maxWidth: 600, marginTop: 12 }}>
      {runStatus !== "running" && runStatus !== "done" && (
        <button
          onClick={() => start()}
          style={{
            padding: "8px 18px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 4,
            fontWeight: 600,
            cursor: "pointer",
            marginRight: 10,
          }}
        >
          {runStatus === "paused" ? "Resume" : "Start"}
        </button>
      )}
      {runStatus === "running" && (
        <button
          onClick={() => pause()}
          style={{
            padding: "8px 18px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: 4,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Pause
        </button>
      )}
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
