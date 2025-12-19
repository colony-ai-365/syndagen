// Move to: dataset/VariableLengthsDisplay.tsx
import React from "react";

type VariableLengthsDisplayProps = {
  variableLengths: Record<string, number>;
  maxCombinations: number;
};

export default function VariableLengthsDisplay({
  variableLengths,
  maxCombinations,
}: VariableLengthsDisplayProps) {
  if (Object.keys(variableLengths).length === 0) return null; // Move this file to dataset/
  return (
    <div
      style={{
        maxWidth: 600,
        marginTop: 18,
        marginBottom: 18,
        background: "#f3f4f6",
        padding: 12,
        borderRadius: 6,
      }}
    >
      <b>Variable Lengths:</b>
      <div style={{ marginTop: 6 }}>
        <b>Max combinations:</b> {maxCombinations}
      </div>
      <ul style={{ marginTop: 6 }}>
        {Object.entries(variableLengths).map(([key, len]) => (
          <li key={key}>
            <span style={{ fontFamily: "monospace", color: "#ea580c" }}>
              {key}
            </span>
            : {len}
          </li>
        ))}
      </ul>
    </div>
  );
}
