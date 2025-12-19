"use client";

import { useCallback } from "react";
import type { Generator } from "./useGeneratorHydration";

export function useGeneratorActions(opts: {
  generatorId?: number;
  generator: Generator | null;
  gap: number;
  savedCount: number;
  selectedNumCombinations: number;
  setGenerator: (g: Generator) => void;
  startRun: () => void;
}) {
  const {
    generatorId,
    generator,
    gap,
    savedCount,
    selectedNumCombinations,
    setGenerator,
    startRun,
  } = opts;

  const canResume =
    !!generatorId &&
    !!generator &&
    generator.status === "started" &&
    savedCount < selectedNumCombinations;

  const canStartFresh =
    !!generatorId && !!generator && generator.status === "draft";

  const startOrResume = useCallback(() => {
    if (!generatorId || !generator) return;

    if (generator.status === "draft") {
      void fetch(`/api/generator/${generatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gap, status: "started" }),
      }).then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as any;
        if (r.ok && d.generator) setGenerator(d.generator);
        startRun();
      });
      return;
    }

    if (canResume) startRun();
  }, [generatorId, generator, gap, setGenerator, startRun, canResume]);

  return {
    canResume,
    canStartFresh,
    startOrResume,
  };
}
