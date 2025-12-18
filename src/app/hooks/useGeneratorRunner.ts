"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildTestBody,
  buildVariableValuesForCombination,
  computeMaxCombinations,
  injectVariables,
} from "@/app/utils/generatorHelpers";

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

export type GeneratedResult = {
  combo: number;
  inputs: Record<string, string>;
  output?: unknown;
  error?: string;
};

export function useGeneratorRunner(
  config: RequestConfig | null,
  variableLengths: Record<string, number>
) {
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "paused" | "done"
  >("idle");
  const [currentCombination, setCurrentCombination] = useState<number>(0);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<unknown | null>(null);
  const [testError, setTestError] = useState("");

  const maxCombinations = computeMaxCombinations(variableLengths);

  // refs for stable control across async loop
  const cancelledRef = useRef(false);
  const runStatusRef = useRef(runStatus);
  runStatusRef.current = runStatus;

  useEffect(() => {
    if (!config) return;
    if (runStatus !== "running") return;
    if (maxCombinations <= 0) return;

    cancelledRef.current = false;

    const run = async () => {
      let combo = currentCombination <= 0 ? 1 : currentCombination;
      if (combo > maxCombinations) {
        setRunStatus("done");
        return;
      }

      while (!cancelledRef.current && combo <= maxCombinations) {
        if (runStatusRef.current !== "running") return;

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
        } catch (err: unknown) {
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

      if (!cancelledRef.current) setRunStatus("done");
    };

    run();
    return () => {
      cancelledRef.current = true;
    };
    // intentionally limited deps to control re-entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus, config, maxCombinations]);

  function start() {
    if (runStatus === "running") return;
    if (runStatus === "done") {
      setGeneratedResults([]);
      setCurrentCombination(0);
    }
    setRunStatus("running");
  }

  function pause() {
    setRunStatus("paused");
  }

  function restart() {
    setGeneratedResults([]);
    setCurrentCombination(0);
    setRunStatus("running");
  }

  async function handleTestApiOnce() {
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

  return {
    runStatus,
    start,
    pause,
    restart,
    currentCombination,
    generatedResults,
    maxCombinations,
    testLoading,
    testResult,
    testError,
    handleTestApiOnce,
  };
}
