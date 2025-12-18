"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DatasetGeneratorsSection() {
  const [generators, setGenerators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newConfigId, setNewConfigId] = useState("");
  const [configs, setConfigs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Fetch generators
  const fetchGenerators = () => {
    setLoading(true);
    fetch("/api/generator")
      .then((res) => res.json())
      .then((data) => {
        setGenerators(data);
        setLoading(false);
      });
  };

  // Fetch configs for dropdown
  const fetchConfigs = () => {
    fetch("/api/request-config")
      .then((res) => res.json())
      .then((data) => setConfigs(data));
  };

  useEffect(() => {
    fetchGenerators();
    fetchConfigs();
  }, []);

  // Handle create generator
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, config_id: Number(newConfigId) }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setNewName("");
        setNewConfigId("");
        fetchGenerators();
      } else {
        setError(data.error || "Failed to create generator");
      }
    } catch {
      setError("Failed to create generator");
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
      const res = await fetch(`/api/generator/${pendingDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchGenerators();
      } else {
        setError(data.error || "Failed to delete generator");
        setLoading(false);
      }
    } catch {
      setError("Failed to delete generator");
      setLoading(false);
    }
    setPendingDeleteId(null);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl font-bold">Dataset Generators</h1>
      {/* Create Generator Form */}
      <form
        onSubmit={handleCreate}
        className="w-full max-w-2xl flex gap-2 items-center mb-6"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Enter generator name..."
          required
          disabled={creating}
        />
        <select
          value={newConfigId}
          onChange={(e) => setNewConfigId(e.target.value)}
          className="border px-3 py-2 rounded"
          required
          disabled={creating}
        >
          <option value="">Select config...</option>
          {configs.map((cfg) => (
            <option key={cfg.id} value={cfg.id}>
              {cfg.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={creating || !newName.trim() || !newConfigId}
        >
          {creating ? "Creating..." : "Create Generator"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : generators.length === 0 ? (
        <div>No generators found.</div>
      ) : (
        <ul className="w-full max-w-2xl">
          {generators.map((gen) => (
            <li
              key={gen.id}
              className="flex justify-between items-center border-b py-2"
            >
              <span>
                <strong>{gen.name}</strong>{" "}
                <span className="text-gray-500">
                  (Config ID: {gen.config_id})
                </span>
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/dataset-generators/${gen.config_id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  title="Run generator"
                >
                  Run
                </Link>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => requestDelete(gen.id)}
                  disabled={loading}
                  title="Delete generator"
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
        title="Delete Generator"
        message="Are you sure you want to delete this generator? This action cannot be undone."
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
