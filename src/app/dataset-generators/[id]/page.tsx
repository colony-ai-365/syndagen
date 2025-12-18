"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CollapsibleConfigPreview from "../../components/CollapsibleConfigPreview";
import { getVariableLengths } from "../../utils/generatorHelpers";
import { useGeneratorRunner } from "@/app/hooks/useGeneratorRunner";

type RequestConfig = {
  id?: string | number;
  route: string;
  method: string;
  field?: string;
  prompt?: string;
  headers?: string;
  schema?: string;
  body_fields?: string;
  additional_fields?: string;
  variables?: string;
};

type GeneratedResult = {
  combo: number;
  inputs: Record<string, string>;
  output?: unknown;
  error?: string;
};

export default function GeneratorConfigPage() {
  const params = useParams();
  const id = params?.id;
  const [config, setConfig] = useState<RequestConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // test state is provided by `useGeneratorRunner` hook
  const [variableLengths, setVariableLengths] = useState<
    Record<string, number>
  >({});
  const [maxCombinations, setMaxCombinations] = useState(0);

  const {
    runStatus,
    start,
    pause,
    restart,
    currentCombination,
    generatedResults,
    maxCombinations: hookMax,
    testLoading: hookTestLoading,
    testResult: hookTestResult,
    testError: hookTestError,
    handleTestApiOnce,
  } = useGeneratorRunner(config, variableLengths);

  // keep local maxCombinations in sync with hook
  useEffect(() => {
    setMaxCombinations(hookMax);
  }, [hookMax]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetch(`/api/request-config/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(err.error || "Failed to fetch config");
        }
        return res.json() as Promise<RequestConfig>;
      })
      .then((data) => {
        setConfig(data);
        // Fetch variable lengths after config is loaded
        getVariableLengths(data).then((lens) => {
          setVariableLengths(lens);
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // run loop moved into hook useGeneratorRunner

  // test action moved to hook: `handleTestApiOnce`

  return (
    <div>
      <div>Generator Config Page: {id}</div>
      {loading && <div>Loading config...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {config && <CollapsibleConfigPreview config={config} />}
      {/* Variable lengths display */}
      {config && Object.keys(variableLengths).length > 0 && (
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
      )}

      {/* Generator controls */}
      {config && maxCombinations > 0 && (
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
                | <b>Current:</b>{" "}
                {Math.min(currentCombination, maxCombinations)} /{" "}
                {maxCombinations}
              </>
            )}
          </div>
        </div>
      )}

      {/* Generated results list */}
      {generatedResults.length > 0 && (
        <div style={{ maxWidth: 900, marginTop: 18 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
            Generated Results
          </h3>
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
      )}
      {/* Test API button and result */}
      {config && (
        <div style={{ maxWidth: 600, marginTop: 18 }}>
          <button
            onClick={handleTestApiOnce}
            disabled={!!hookTestLoading}
            style={{
              padding: "8px 18px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              cursor: hookTestLoading ? "not-allowed" : "pointer",
            }}
          >
            {hookTestLoading ? "Testing..." : "Test API"}
          </button>
          {hookTestError && (
            <div style={{ color: "red", marginTop: 8 }}>{hookTestError}</div>
          )}
          {hookTestResult !== null && (
            <pre
              style={{
                marginTop: 10,
                background: "#e0e7ff",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {typeof hookTestResult === "string"
                ? hookTestResult
                : JSON.stringify(hookTestResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
