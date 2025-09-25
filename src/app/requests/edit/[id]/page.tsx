// page.tsx
// Main home page for the Syndagen API testing app. Manages result state and renders the form and display components.
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import APIForm from "../../../components/APIForm";
import ResultDisplay from "../../../components/ResultDisplay";

export default function EditRequestPage() {
  const params = useParams();
  const id = params?.id;
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [config, setConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/request-config/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8 font-sans">
      <h1 className="text-2xl font-bold">Request Configuration</h1>
      {loading ? (
        <div>Loading...</div>
      ) : config && config.id ? (
        <APIForm
          setResult={setResult}
          setError={setError}
          initialConfig={config}
        />
      ) : (
        <div className="text-red-600">Request config not found.</div>
      )}
      <ResultDisplay result={result} error={error} />
    </div>
  );
}
