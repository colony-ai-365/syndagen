import React, { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

type Datalist = {
  id: number;
  name: string;
};

const ManageDatalists: React.FC = () => {
  const [datalists, setDatalists] = useState<Datalist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewEntries, setPreviewEntries] = useState<
    Record<number, string[]>
  >({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState<
    Record<number, boolean>
  >({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const fetchDatalists = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/datalist", { signal });
      if (!res.ok) {
        // try to parse error body if present
        const body = await res.text();
        throw new Error(body || `Failed to load datalists (${res.status})`);
      }
      const data = await res.json();
      setDatalists(data);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to load datalists");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(
    async (id: number, signal?: AbortSignal) => {
      // don't reload preview if already loaded
      if (previewEntries[id] || loadingPreviewIds[id]) return;
      setLoadingPreviewIds((p) => ({ ...p, [id]: true }));
      try {
        const res = await fetch(`/api/datalist/${id}`, { signal });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load preview (${res.status})`);
        }
        const data: string[] = await res.json();
        setPreviewEntries((prev) => ({ ...prev, [id]: data }));
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setPreviewEntries((prev) => ({
          ...prev,
          [id]: ["Failed to load entries"],
        }));
      } finally {
        setLoadingPreviewIds((p) => {
          const copy = { ...p };
          delete copy[id];
          return copy;
        });
      }
    },
    [previewEntries, loadingPreviewIds]
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchDatalists(ac.signal);
    return () => ac.abort();
  }, [fetchDatalists]);

  // Show confirmation dialog before delete
  const requestDelete = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  // Handle confirmed delete
  const handleDeleteConfirmed = async () => {
    if (pendingDeleteId == null) return;
    setDeletingId(pendingDeleteId);
    setConfirmOpen(false);
    setError("");
    try {
      const res = await fetch(`/api/datalist/${pendingDeleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const body = await (async () => {
        try {
          return await res.json();
        } catch {
          return { success: res.ok };
        }
      })();

      if (res.ok && (body.success === undefined ? true : body.success)) {
        // refresh list
        fetchDatalists();
        setPreviewEntries((prev) => {
          const copy = { ...prev };
          delete copy[pendingDeleteId];
          return copy;
        });
      } else {
        setError(body.error || `Failed to delete datalist (${res.status})`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete datalist");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl font-bold">Manage Datalists</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : datalists.length === 0 ? (
        <div>No datalists found.</div>
      ) : (
        <ul className="w-full max-w-2xl">
          {datalists.map((dl) => (
            <li key={dl.id} className="flex flex-col border-b py-2">
              <div className="flex justify-between items-center">
                <span>
                  <strong>{dl.name}</strong>
                  <span className="text-gray-500 ml-2">(ID: {dl.id})</span>
                </span>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                  onClick={() => requestDelete(dl.id)}
                  disabled={deletingId === dl.id}
                  title="Delete datalist"
                >
                  {deletingId === dl.id ? "Deleting..." : "Delete"}
                </button>
              </div>

              <div className="flex gap-2 mt-2 items-center">
                <button
                  className="px-2 py-1 bg-blue-100 rounded text-sm disabled:opacity-50"
                  onClick={() => {
                    const ac = new AbortController();
                    fetchPreview(dl.id, ac.signal);
                    // no need to keep reference to ac here; fetchPreview respects abort
                  }}
                  disabled={
                    !!previewEntries[dl.id] || !!loadingPreviewIds[dl.id]
                  }
                >
                  {previewEntries[dl.id]
                    ? "Preview loaded"
                    : loadingPreviewIds[dl.id]
                    ? "Loading preview..."
                    : "Preview entries"}
                </button>
                <span className="text-xs text-gray-500">
                  {previewEntries[dl.id]?.length
                    ? `${previewEntries[dl.id].length} entries`
                    : null}
                </span>
              </div>

              {previewEntries[dl.id] && (
                <ul className="mt-2 max-h-32 overflow-y-auto border rounded bg-white p-2 text-sm">
                  {previewEntries[dl.id].slice(0, 10).map((val, idx) => (
                    <li key={idx} className="border-b last:border-b-0 py-1">
                      {val}
                    </li>
                  ))}
                  {previewEntries[dl.id].length > 10 && (
                    <li className="text-gray-400">
                      ...and {previewEntries[dl.id].length - 10} more
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Datalist"
        message="Are you sure you want to delete this datalist? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
};

export default ManageDatalists;
