"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CollapsibleConfigPreview from "../../components/CollapsibleConfigPreview";

import {
  injectVariables,
  getFirstVariableValues,
  buildTestBody,
} from "../../utils/generatorHelpers";

export default function GeneratorConfigPage() {
  const params = useParams();
  const id = params?.id;
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetch(`/api/request-config/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch config");
        }
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleTestApi() {
    setTestLoading(true);
    setTestResult(null);
    setTestError("");
    try {
      const variablesObj = JSON.parse(config.variables || "{}");
      const variableValues = await getFirstVariableValues(variablesObj);
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
      const data = await res.json();
      if (res.ok) setTestResult(data.data);
      else setTestError(data.error || "Validation failed");
    } catch (err: any) {
      setTestError(err.message || "Failed to test API");
    }
    setTestLoading(false);
  }

  return (
    <div>
      <div>Generator Config Page: {id}</div>
      {loading && <div>Loading config...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {config && <CollapsibleConfigPreview config={config} />}
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
          {testResult && (
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
