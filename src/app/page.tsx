"use client";
import { useState } from "react";
import APIForm from "./components/APIForm";
import ResultDisplay from "./components/ResultDisplay";

export default function Home() {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  // You can pass setResult and setError as props to APIForm if you want to lift state up
  // For now, just render the form and result display
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8 font-sans">
      <h1 className="text-2xl font-bold">API Tester</h1>
      <APIForm />
      <ResultDisplay result={result} error={error} />
    </div>
  );
}
