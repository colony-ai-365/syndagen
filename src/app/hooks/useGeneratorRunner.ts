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

type PersistedEntryInfo = {
  entryId: number;
  index: number;
  combo: number;
};

export function useGeneratorRunner(
  config: RequestConfig | null,
  variableLengths: Record<string, number>,
  gap: number = 1,
  opts?: {
    generatorId?: number;
    initialPersistedCount?: number;
    onEntryPersisted?: (info: PersistedEntryInfo) => void;
    onPersistError?: (message: string) => void;
  }
) {
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "paused" | "done"
  >("idle");
  const [currentCombination, setCurrentCombination] = useState<number>(0);

  const [persistedCount, setPersistedCount] = useState(
    opts?.initialPersistedCount ?? 0
  );
  const [persistError, setPersistError] = useState<string>("");

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<unknown | null>(null);
  const [testError, setTestError] = useState("");

  const maxCombinations = computeMaxCombinations(variableLengths);
  const selectedNumCombinations =
    maxCombinations > 0 && gap > 0
      ? Math.floor((maxCombinations - 1) / gap) + 1
      : 0;

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
      const safeGap = Math.max(1, Number.isFinite(gap) ? gap : 1);
      // If we have persisted entries but currentCombination isn't set, resume from next
      // combo for the selected gap: 1, 1+gap, 1+2gap, ...
      let combo =
        currentCombination > 0
          ? currentCombination
          : Math.max(1, 1 + persistedCount * safeGap);
      if (combo > maxCombinations) {
        setRunStatus("done");
        return;
      }

      while (
        !cancelledRef.current &&
        combo <= maxCombinations &&
        persistedCount < selectedNumCombinations
      ) {
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

          const result: GeneratedResult = !res.ok
            ? {
                combo,
                inputs,
                error: data.error || `Request failed (${res.status})`,
              }
            : { combo, inputs, output: data.data };

          // Persist to backend if generatorId is provided
          if (opts?.generatorId) {
            try {
              setPersistError("");
              const persistRes = await fetch(
                `/api/generator/${opts.generatorId}/entry`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    inputs: result.inputs,
                    output:
                      typeof result.output !== "undefined"
                        ? result.output
                        : { error: result.error },
                    combo: result.combo,
                    error: result.error,
                  }),
                }
              );
              const persistData = (await persistRes
                .json()
                .catch(() => ({}))) as
                | { id?: number; success?: boolean; error?: string }
                | any;
              if (!persistRes.ok || !persistData?.id) {
                const msg =
                  persistData?.error ||
                  `Failed to persist entry (${persistRes.status})`;
                setPersistError(msg);
                opts?.onPersistError?.(msg);
              } else {
                setPersistedCount((c) => {
                  const next = c + 1;
                  opts?.onEntryPersisted?.({
                    entryId: Number(persistData.id),
                    index: next - 1,
                    combo: result.combo,
                  });
                  return next;
                });
              }
            } catch (e: unknown) {
              const msg =
                e instanceof Error ? e.message : "Failed to persist entry";
              setPersistError(msg);
              opts?.onPersistError?.(msg);
            }
          }
        } catch (err: unknown) {
          const result: GeneratedResult = {
            combo,
            inputs: {},
            error: err instanceof Error ? err.message : "Failed to generate",
          };
          if (opts?.generatorId) {
            try {
              setPersistError("");
              const persistRes = await fetch(
                `/api/generator/${opts.generatorId}/entry`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    inputs: result.inputs,
                    output: { error: result.error },
                    combo: result.combo,
                    error: result.error,
                  }),
                }
              );
              const persistData = (await persistRes
                .json()
                .catch(() => ({}))) as
                | { id?: number; success?: boolean; error?: string }
                | any;
              if (!persistRes.ok || !persistData?.id) {
                const msg =
                  persistData?.error ||
                  `Failed to persist entry (${persistRes.status})`;
                setPersistError(msg);
                opts?.onPersistError?.(msg);
              } else {
                setPersistedCount((c) => {
                  const next = c + 1;
                  opts?.onEntryPersisted?.({
                    entryId: Number(persistData.id),
                    index: next - 1,
                    combo: result.combo,
                  });
                  return next;
                });
              }
            } catch (e: unknown) {
              const msg =
                e instanceof Error ? e.message : "Failed to persist entry";
              setPersistError(msg);
              opts?.onPersistError?.(msg);
            }
          }
        }

        combo += safeGap;
      }

      if (!cancelledRef.current) setRunStatus("done");
    };

    run();
    return () => {
      cancelledRef.current = true;
    };
    // intentionally limited deps to control re-entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus, config, maxCombinations, gap]);

  // Allow caller to hydrate persistedCount after mount
  useEffect(() => {
    if (typeof opts?.initialPersistedCount === "number") {
      setPersistedCount(opts.initialPersistedCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.initialPersistedCount]);

  function start() {
    if (runStatus === "running") return;
    if (runStatus === "done") {
      setCurrentCombination(0);
      // If caller hydrated persistedCount, preserve it for resume semantics
      // (restart should be used to reset).
      setPersistError("");
    }
    setRunStatus("running");
  }

  function pause() {
    setRunStatus("paused");
  }

  function restart() {
    setCurrentCombination(0);
    setPersistedCount(0);
    setPersistError("");
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
    persistedCount,
    persistError,
    maxCombinations,
    testLoading,
    testResult,
    testError,
    handleTestApiOnce,
  };
}
