"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CollapsibleConfigPreview from "../../components/preview/CollapsibleConfigPreview";
import GeneratorControls from "../../components/dataset/GeneratorControls";
import PersistedEntryViewer from "../../components/dataset/PersistedEntryViewer";
import TestApiSection from "../../components/dataset/TestApiSection";
import VariableLengthsDisplay from "../../components/dataset/VariableLengthsDisplay";

import { getVariableLengths } from "../../utils/generatorHelpers";
import { useGeneratorActions } from "@/app/hooks/useGeneratorActions";
import { useGeneratorHydration } from "@/app/hooks/useGeneratorHydration";
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

export default function GeneratorConfigPage() {
  const params = useParams();
  const id = params?.id;
  const searchParams = useSearchParams();
  const generatorIdParam = searchParams.get("generatorId");
  const generatorId = generatorIdParam ? Number(generatorIdParam) : NaN;
  const finiteGeneratorId = Number.isFinite(generatorId)
    ? generatorId
    : undefined;

  const [config, setConfig] = useState<RequestConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [variableLengths, setVariableLengths] = useState<
    Record<string, number>
  >({});
  const [maxCombinations, setMaxCombinations] = useState(0);
  const [gap, setGap] = useState(1);

  const {
    generator,
    setGenerator,
    hydratedGap,
    savedCount,
    setSavedCount,
    error: hydrateError,
  } = useGeneratorHydration(finiteGeneratorId);

  useEffect(() => {
    if (typeof hydratedGap === "number" && hydratedGap > 0) setGap(hydratedGap);
  }, [hydratedGap]);

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
        void getVariableLengths(data).then(setVariableLengths);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedNumCombinations = useMemo(() => {
    return maxCombinations > 0 && gap > 0
      ? Math.floor((maxCombinations - 1) / gap) + 1
      : 0;
  }, [gap, maxCombinations]);

  const runner = useGeneratorRunner(config, variableLengths, gap, {
    generatorId: finiteGeneratorId,
    initialPersistedCount: savedCount,
    onEntryPersisted: ({ index }) => setSavedCount(index + 1),
  });

  useEffect(
    () => setMaxCombinations(runner.maxCombinations),
    [runner.maxCombinations]
  );

  const actions = useGeneratorActions({
    generatorId: finiteGeneratorId,
    generator,
    gap,
    savedCount,
    selectedNumCombinations,
    setGenerator: (g) => setGenerator(g),
    startRun: runner.start,
  });

  const effectiveRunStatus =
    // If we've already persisted all selected combinations, treat as done so Start is hidden.
    runner.persistedCount >= selectedNumCombinations &&
    selectedNumCombinations > 0
      ? "done"
      : generator?.status === "started" &&
        (runner.runStatus === "idle" || runner.runStatus === "done") &&
        savedCount < selectedNumCombinations
      ? "paused"
      : runner.runStatus;

  // Determine id to use for export: prefer search param, fall back to hydrated generator id
  const exportId = Number.isFinite(finiteGeneratorId)
    ? finiteGeneratorId
    : (generator?.id as number | undefined);

  return (
    <div>
      <div>Generator Config Page: {String(id ?? "")}</div>
      {loading && <div>Loading config...</div>}
      {(error || hydrateError) && (
        <div style={{ color: "red" }}>Error: {error || hydrateError}</div>
      )}

      {config && <CollapsibleConfigPreview config={config} />}

      {config && generator && (
        <div style={{ maxWidth: 600, margin: "18px 0" }}>
          <label htmlFor="gap-slider" style={{ fontWeight: 600 }}>
            Gap: <span style={{ color: "#ea580c" }}>{gap}</span>
          </label>
          <input
            id="gap-slider"
            type="range"
            min={1}
            max={Math.max(1, maxCombinations)}
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
            disabled={generator.status === "started"}
            style={{ width: "100%", marginTop: 6 }}
          />
          <div style={{ marginTop: 8 }}>
            <b>Selected combinations:</b> {selectedNumCombinations}{" "}
            <span style={{ color: "#888" }}>(max: {maxCombinations})</span>
          </div>
          <div style={{ marginTop: 6, color: "#374151" }}>
            <b>Generated:</b> {savedCount} / {selectedNumCombinations}
          </div>
          {generator.status === "started" && (
            <div style={{ marginTop: 6, color: "#6b7280" }}>
              Gap is locked (generator started).
            </div>
          )}
        </div>
      )}

      {config && (
        <VariableLengthsDisplay
          variableLengths={variableLengths}
          maxCombinations={maxCombinations}
        />
      )}

      {config && generator && (
        <GeneratorControls
          runStatus={effectiveRunStatus}
          start={actions.startOrResume}
          pause={runner.pause}
          currentCombination={runner.currentCombination}
          maxCombinations={maxCombinations}
        />
      )}

      {runner.persistError && (
        <div style={{ color: "#b91c1c", marginTop: 10 }}>
          Persist error: {runner.persistError}
        </div>
      )}

      <PersistedEntryViewer
        generatorId={finiteGeneratorId}
        runStatus={effectiveRunStatus}
        persistedCount={runner.persistedCount}
        onHydrateCount={(total) => setSavedCount(total)}
      />
      <div style={{ marginTop: 12 }}>
        <button
          className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={typeof exportId !== "number" || !Number.isFinite(exportId)}
          onClick={async () => {
            if (typeof exportId !== "number" || !Number.isFinite(exportId))
              return;
            try {
              const res = await fetch(`/api/generator/${exportId}/export`);
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Export failed (${res.status})`);
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `generator-${exportId}-entries.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (e: unknown) {
              console.error(e);
              alert(e instanceof Error ? e.message : "Failed to export CSV");
            }
          }}
        >
          Export CSV
        </button>
        {typeof exportId !== "number" || !Number.isFinite(exportId) ? (
          <span style={{ marginLeft: 8, color: "#6b7280" }}>
            (waiting for generator id)
          </span>
        ) : null}
      </div>
      {config && (
        <TestApiSection
          handleTestApiOnce={runner.handleTestApiOnce}
          testLoading={!!runner.testLoading}
          testResult={runner.testResult}
          testError={runner.testError || ""}
        />
      )}
    </div>
  );
}
