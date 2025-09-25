// Home page for listing and managing saved request configs
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

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
        // Optionally scroll to new item
      } else {
        setError(data.error || "Failed to create request");
      }
    } catch {
      setError("Failed to create request");
    }
    setCreating(false);
  };

  // Handle delete request
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/request-config/${id}`, {
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
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8 font-sans">
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
                  onClick={() => handleDelete(cfg.id)}
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
    </div>
  );
}
