"use client";

import { useEffect, useState } from "react";

export type PersistedEntry = {
  id: number;
  generator_id: number;
  inputs: Record<string, string>;
  output: string;
};

type Props = {
  generatorId?: number;
  runStatus: "idle" | "running" | "paused" | "done";
  persistedCount: number;
  onHydrateCount?: (total: number) => void;
};

export default function PersistedEntryViewer({
  generatorId,
  runStatus,
  persistedCount,
  onHydrateCount,
}: Props) {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);
  const [selectedEntry, setSelectedEntry] = useState<PersistedEntry | null>(
    null
  );
  const [entryTotal, setEntryTotal] = useState<number>(0);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState<string>("");

  async function fetchEntry(n: number) {
    if (!generatorId) return;
    setEntryLoading(true);
    setEntryError("");
    try {
      const res = await fetch(`/api/generator/${generatorId}/entry?n=${n}`);
      const data = (await res.json().catch(() => ({}))) as {
        entry?: PersistedEntry;
        index?: number;
        total?: number;
        error?: string;
      };
      if (!res.ok || !data.entry) {
        throw new Error(data.error || `Failed to load entry (${res.status})`);
      }
      setSelectedEntry(data.entry);
      if (typeof data.total === "number") {
        setEntryTotal(data.total);
        onHydrateCount?.(data.total);
      }
      if (typeof data.index === "number") setSelectedEntryIndex(data.index);
    } catch (e: unknown) {
      setEntryError(e instanceof Error ? e.message : "Failed to load entry");
      setSelectedEntry(null);
    } finally {
      setEntryLoading(false);
    }
  }

  // When new entries arrive, follow the latest.
  useEffect(() => {
    if (!generatorId) return;
    if (persistedCount <= 0) return;
    const idx = persistedCount - 1;
    setSelectedEntryIndex(idx);
    void fetchEntry(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorId, persistedCount]);

  const canBrowse =
    runStatus !== "running" && (persistedCount > 0 || entryTotal > 0);

  return (
    <div style={{ maxWidth: 900, marginTop: 18 }}>
      <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Generated Entry</h3>

      {entryError && (
        <div style={{ color: "#b91c1c", marginBottom: 8 }}>{entryError}</div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ color: "#374151" }}>
          <b>Saved:</b> {persistedCount}
        </span>
        <span style={{ color: "#374151" }}>
          <b>Viewing:</b> {entryTotal ? selectedEntryIndex + 1 : 0} /{" "}
          {entryTotal}
        </span>
      </div>

      {canBrowse && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <button
            onClick={() => {
              const next = Math.max(0, selectedEntryIndex - 1);
              setSelectedEntryIndex(next);
              void fetchEntry(next);
            }}
            disabled={entryLoading || selectedEntryIndex <= 0}
            style={{ padding: "6px 10px" }}
            title="Previous"
          >
            {"<"}
          </button>
          <button
            onClick={() => {
              const next = selectedEntryIndex + 1;
              setSelectedEntryIndex(next);
              void fetchEntry(next);
            }}
            disabled={
              entryLoading ||
              (entryTotal > 0 && selectedEntryIndex >= entryTotal - 1)
            }
            style={{ padding: "6px 10px" }}
            title="Next"
          >
            {">"}
          </button>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Nth:
            <input
              type="number"
              min={1}
              max={entryTotal || 1}
              value={entryTotal ? selectedEntryIndex + 1 : 1}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.max(0, (Number.isFinite(v) ? v : 1) - 1);
                setSelectedEntryIndex(idx);
              }}
              onBlur={() => void fetchEntry(selectedEntryIndex)}
              disabled={entryLoading || entryTotal === 0}
              style={{ width: 90 }}
            />
          </label>
        </div>
      )}

      {entryLoading ? (
        <div>Loading entry...</div>
      ) : !selectedEntry ? (
        <div style={{ color: "#6b7280" }}>No entry selected yet.</div>
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: 10,
            background: "#f8fafc",
          }}
        >
          <div
            style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 6 }}
          >
            {Object.entries(selectedEntry.inputs || {})
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(", ")}
          </div>
          <pre
            style={{
              marginTop: 6,
              background: "#e0e7ff",
              padding: 10,
              borderRadius: 4,
            }}
          >
            {selectedEntry.output}
          </pre>
        </div>
      )}
    </div>
  );
}
