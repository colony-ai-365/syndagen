"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CollapsibleConfigPreview from "../../components/CollapsibleConfigPreview";
import {
  buildTestBody,
  buildVariableValuesForCombination,
  computeMaxCombinations,
  getVariableLengths,
  injectVariables,
} from "../../utils/generatorHelpers";

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
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<unknown>(null);
  const [testError, setTestError] = useState("");
  const [variableLengths, setVariableLengths] = useState<
    Record<string, number>
  >({});
  const [maxCombinations, setMaxCombinations] = useState(0);

  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "paused" | "done"
  >("idle");
  const [currentCombination, setCurrentCombination] = useState(0);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );

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
          setMaxCombinations(computeMaxCombinations(lens));
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Run loop (sequential, respects pause)
  useEffect(() => {
    if (!config) return;
    if (runStatus !== "running") return;
    if (maxCombinations <= 0) return;

    let cancelled = false;

    const run = async () => {
      // next combo to run
      let combo = currentCombination <= 0 ? 1 : currentCombination;
      if (combo > maxCombinations) {
        setRunStatus("done");
        return;
      }

      while (!cancelled && combo <= maxCombinations) {
        // If user paused mid-loop, stop cleanly
        if (runStatus !== "running") return;

        setCurrentCombination(combo);

        try {
          const { variableValues, inputs } =
            await buildVariableValuesForCombination(
              config,
              variableLengths,
              combo
            );

          const promptObj = JSON.parse(config.prompt || "{}");
          const promptKey = Object.keys(promptObj)[0] || "prompt";
          const promptTemplate = promptObj[promptKey] || "";
          const injectedPrompt = injectVariables(
            promptTemplate,
            variableValues
          );
          const body = buildTestBody(config, injectedPrompt);
          const headers = JSON.parse(config.headers || "{}");
          const schema = config.schema ? JSON.parse(config.schema) : undefined;

          const res = await fetch("/api/test-api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              route: config.route,
              body,
              method: config.method,
              field: config.field,
              schema,
              headers,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            data?: unknown;
            error?: string;
          };

          if (!res.ok) {
            setGeneratedResults((prev) => [
              ...prev,
              {
                combo,
                inputs,
                error: data.error || `Request failed (${res.status})`,
              },
            ]);
          } else {
            setGeneratedResults((prev) => [
              ...prev,
              { combo, inputs, output: data.data },
            ]);
          }
        } catch (err: any) {
          setGeneratedResults((prev) => [
            ...prev,
            {
              combo,
              inputs: {},
              error: err instanceof Error ? err.message : "Failed to generate",
            },
          ]);
        }

        combo += 1;
      }

      if (!cancelled) {
        setRunStatus("done");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // Intentionally NOT depending on currentCombination to avoid restarting loop each increment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus, config, maxCombinations]);

  async function handleTestApi() {
    if (!config) return;
    setTestLoading(true);
    setTestResult(null);
    setTestError("");
    try {
      const { variableValues } = await buildVariableValuesForCombination(
        config,
        variableLengths,
        1
      );
      const promptObj = JSON.parse(config.prompt || "{}");
      const promptKey = Object.keys(promptObj)[0] || "prompt";
      const promptTemplate = promptObj[promptKey] || "";
      const injectedPrompt = injectVariables(promptTemplate, variableValues);
      const body = buildTestBody(config, injectedPrompt);
      const headers = JSON.parse(config.headers || "{}");
      const schema = config.schema ? JSON.parse(config.schema) : undefined;
      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: config.route,
          body,
          method: config.method,
          field: config.field,
          schema,
          headers,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        data?: unknown;
        error?: string;
      };
      if (res.ok) setTestResult(data.data);
      else setTestError(data.error || "Validation failed");
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : "Failed to test API");
    }
    setTestLoading(false);
  }

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
              if (runStatus === "done") {
                setGeneratedResults([]);
                setCurrentCombination(0);
              }
              setRunStatus("running");
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
            onClick={() => setRunStatus("paused")}
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
            onClick={handleTestApi}
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
      )}
    </div>
  );
}
