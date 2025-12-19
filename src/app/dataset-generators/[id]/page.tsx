"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CollapsibleConfigPreview from "../../components/preview/CollapsibleConfigPreview";
import VariableLengthsDisplay from "../../components/dataset/VariableLengthsDisplay";
import GeneratorControls from "../../components/dataset/GeneratorControls";
import GeneratedResultsList from "../../components/dataset/GeneratedResultsList";
import TestApiSection from "../../components/dataset/TestApiSection";
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
      {config && (
        <VariableLengthsDisplay
          variableLengths={variableLengths}
          maxCombinations={maxCombinations}
        />
      )}

      {/* Generator controls */}
      {config && (
        <GeneratorControls
          runStatus={runStatus}
          start={start}
          pause={pause}
          restart={restart}
          currentCombination={currentCombination}
          maxCombinations={maxCombinations}
        />
      )}

      {/* Generated results list */}
      <GeneratedResultsList generatedResults={generatedResults} />
      {/* Test API button and result */}
      {config && (
        <TestApiSection
          handleTestApiOnce={handleTestApiOnce}
          testLoading={!!hookTestLoading}
          testResult={hookTestResult}
          testError={hookTestError || ""}
        />
      )}
    </div>
  );
}
