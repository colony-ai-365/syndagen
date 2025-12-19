"use client";

import { useEffect, useState } from "react";

export type Generator = {
  id: number;
  name: string;
  config_id: number;
  gap: number;
  total_combinations: number;
  completed_combinations: number;
  status: "draft" | "started" | "terminated";
};

export type PersistedEntry = {
  id: number;
  generator_id: number;
  inputs: Record<string, string>;
  output: string;
};

export function useGeneratorHydration(generatorId?: number) {
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [hydratedGap, setHydratedGap] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [latestEntry, setLatestEntry] = useState<PersistedEntry | null>(null);
  const [latestIndex, setLatestIndex] = useState<number>(-1);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!generatorId) return;

    const run = async () => {
      try {
        setError("");

        const genRes = await fetch(`/api/generator/${generatorId}`);
        const genData = (await genRes.json().catch(() => ({}))) as {
          generator?: Generator;
          error?: string;
        };
        if (genRes.ok && genData.generator) {
          setGenerator(genData.generator);
          if (
            typeof genData.generator.gap === "number" &&
            genData.generator.gap > 0
          ) {
            setHydratedGap(genData.generator.gap);
          }
        } else if (!genRes.ok) {
          throw new Error(
            genData.error || `Failed to load generator (${genRes.status})`
          );
        }

        const latestRes = await fetch(
          `/api/generator/${generatorId}/entry/latest`
        );
        const latestData = (await latestRes.json().catch(() => ({}))) as {
          entry: PersistedEntry | null;
          index: number;
          total: number;
          error?: string;
        };
        if (!latestRes.ok) {
          throw new Error(
            latestData.error ||
              `Failed to load latest entry (${latestRes.status})`
          );
        }

        setSavedCount(latestData.total || 0);
        setLatestEntry(latestData.entry || null);
        setLatestIndex(
          typeof latestData.index === "number" ? latestData.index : -1
        );
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to load generator state"
        );
      }
    };

    void run();
  }, [generatorId]);

  return {
    generator,
    setGenerator,
    hydratedGap,
    savedCount,
    setSavedCount,
    latestEntry,
    latestIndex,
    error,
  };
}
