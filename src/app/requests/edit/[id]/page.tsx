// page.tsx
// Main home page for the Syndagen API testing app. Manages result state and renders the form and display components.
"use client";
import { useState } from "react";
import APIForm from "../../../components/APIForm";
import ResultDisplay from "../../../components/ResultDisplay";

export default function Home() {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8 font-sans">
      <h1 className="text-2xl font-bold">API Tester</h1>
      <APIForm setResult={setResult} setError={setError} />
      <ResultDisplay result={result} error={error} />
    </div>
  );
}
