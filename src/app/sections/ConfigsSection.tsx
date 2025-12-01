// ConfigsSection.tsx
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ConfigsSection() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Fetch configs
  const fetchConfigs = () => {
    setLoading(true);
    fetch("/api/request-config")
      .then((res) => res.json())
      .then((data) => {
        setConfigs(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Handle create request
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/request-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setNewName("");
        fetchConfigs();
      } else {
        setError(data.error || "Failed to create request");
      }
    } catch {
      setError("Failed to create request");
    }
    setCreating(false);
  };

  // Show confirmation dialog before delete
  const requestDelete = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  // Handle confirmed delete
  const handleDeleteConfirmed = async () => {
    if (pendingDeleteId == null) return;
    setConfirmOpen(false);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/request-config/${pendingDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchConfigs();
      } else {
        setError(data.error || "Failed to delete request");
        setLoading(false);
      }
    } catch {
      setError("Failed to delete request");
      setLoading(false);
    }
    setPendingDeleteId(null);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl font-bold">Saved Request Configs</h1>
      {/* Create Request Form */}
      <form
        onSubmit={handleCreate}
        className="w-full max-w-2xl flex gap-2 items-center mb-6"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Enter request name..."
          required
          disabled={creating}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={creating || !newName.trim()}
        >
          {creating ? "Creating..." : "Create Request"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : configs.length === 0 ? (
        <div>No configs found.</div>
      ) : (
        <ul className="w-full max-w-2xl">
          {configs.map((cfg) => (
            <li
              key={cfg.id}
              className="flex justify-between items-center border-b py-2"
            >
              <span>
                <strong>{cfg.name}</strong>{" "}
                <span className="text-gray-500">
                  ({cfg.method} {cfg.route})
                </span>
              </span>
              <div className="flex gap-2">
                <Link
                  href={`requests/edit/${cfg.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Edit & Test
                </Link>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => requestDelete(cfg.id)}
                  disabled={loading}
                  title="Delete request"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Request Config"
        message="Are you sure you want to delete this request? This action cannot be undone."
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
}
