// Move to: dataset/TestApiSection.tsx
// This file has been moved to dataset/
// Original location: /home/uzer/Dev/Projects/Main/syndagen/src/app/components/TestApiSection.tsx
// New location: /home/uzer/Dev/Projects/Main/syndagen/src/app/dataset/TestApiSection.tsx
import React from "react";

type TestApiSectionProps = {
  handleTestApiOnce: () => void;
  testLoading: boolean;
  testResult: unknown;
  testError: string;
};

export default function TestApiSection({
  handleTestApiOnce,
  testLoading,
  testResult,
  testError,
}: TestApiSectionProps) {
  return (
    <div style={{ maxWidth: 600, marginTop: 18 }}>
      <button
        onClick={handleTestApiOnce}
        disabled={!!testLoading}
        style={{
          padding: "8px 18px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontWeight: 600,
          cursor: testLoading ? "not-allowed" : "pointer",
        }}
      >
        {testLoading ? "Testing..." : "Test API"}
      </button>
      {testError && (
        <div style={{ color: "red", marginTop: 8 }}>{testError}</div>
      )}
      {testResult !== null && (
        <pre
          style={{
            marginTop: 10,
            background: "#e0e7ff",
            padding: 10,
            borderRadius: 4,
          }}
        >
          {typeof testResult === "string"
            ? testResult
            : JSON.stringify(testResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
