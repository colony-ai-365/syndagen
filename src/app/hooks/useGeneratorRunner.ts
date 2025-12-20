"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeMaxCombinations,
  generateResultForCombo,
  persistResult,
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

  const cancelledRef = useRef(false);
  const runStatusRef = useRef(runStatus);
  runStatusRef.current = runStatus;

  const persistedCountRef = useRef(persistedCount);
  useEffect(() => {
    persistedCountRef.current = persistedCount;
  }, [persistedCount]);

  const persistGeneratedResult = useCallback(
    async (result: GeneratedResult) => {
      if (!opts?.generatorId) return;
      try {
        setPersistError("");
        const { id } = await persistResult(opts.generatorId, result);
        setPersistedCount((c) => {
          const next = c + 1;
          opts?.onEntryPersisted?.({
            entryId: id,
            index: next - 1,
            combo: result.combo,
          });
          return next;
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to persist entry";
        setPersistError(msg);
        opts?.onPersistError?.(msg);
      }
    },
    [opts?.generatorId, opts?.onEntryPersisted, opts?.onPersistError]
  );

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
        persistedCountRef.current < selectedNumCombinations
      ) {
        if (runStatusRef.current !== "running") return;

        setCurrentCombination(combo);

        try {
          const result = await generateResultForCombo(
            config,
            combo,
            variableLengths
          );
          await persistGeneratedResult(result);
        } catch (err: unknown) {
          const result: GeneratedResult = {
            combo,
            inputs: {},
            error: err instanceof Error ? err.message : "Failed to generate",
          };
          await persistGeneratedResult(result);
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
  }, [runStatus, config, maxCombinations, gap]);

  // Allow caller to hydrate persistedCount after mount
  useEffect(() => {
    if (typeof opts?.initialPersistedCount === "number") {
      setPersistedCount(opts.initialPersistedCount);
    }
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
      const result = await generateResultForCombo(config, 1, variableLengths);
      if (result.output !== undefined) setTestResult(result.output);
      else setTestError(result.error || "Validation failed");
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
