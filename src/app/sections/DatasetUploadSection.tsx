// DatasetUploadSection.tsx
"use client";
import React, { useState } from "react";
import Papa from "papaparse";

export default function DatasetUploadSection() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [datalistName, setDatalistName] = useState("");
  const [savePreview, setSavePreview] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error parsing CSV: " + results.errors[0].message);
          setCsvData([]);
          setHeaders([]);
        } else {
          setCsvData(results.data as any[]);
          setHeaders(results.meta.fields || []);
        }
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
        setCsvData([]);
        setHeaders([]);
      },
    });
  };

  const totalRows = csvData.length;

  const handleColumnSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const col = e.target.value;
    setSelectedColumn(col);

    if (col && csvData.length > 0) {
      setSavePreview(csvData.map((row) => row[col]));
    } else {
      setSavePreview([]);
    }
  };

  const handleDatalistNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatalistName(e.target.value);
  };

  const handleSaveDatalist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");

    if (!datalistName.trim()) {
      setSaveError("Please enter a name for the datalist.");
      return;
    }

    if (!selectedColumn) {
      setSaveError("Please select a column to save.");
      return;
    }

    if (savePreview.length === 0) {
      setSaveError("Selected column is empty.");
      return;
    }

    try {
      const res = await fetch("/api/datalist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: datalistName.trim(),
          values: savePreview,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg(
          `Datalist '${datalistName}' saved with ${savePreview.length} entries.`
        );
        setDatalistName("");
        setSelectedColumn("");
        setSavePreview([]);
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        setSaveError(result.error || "Failed to save datalist.");
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save datalist.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl font-bold">Upload Dataset (CSV)</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />

      {fileName && <div className="text-gray-700">File: {fileName}</div>}

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
      {csvData.length > 0 && headers.length > 0 && (
        <form
          className="w-full max-w-md mb-6 p-4 border rounded bg-gray-50 flex flex-col gap-4"
          onSubmit={handleSaveDatalist}
        >
          <h2 className="text-lg font-semibold mb-2">
            Save Column as Datalist
          </h2>

          <label className="font-medium">Datalist Name</label>
          <input
            type="text"
            value={datalistName}
            onChange={handleDatalistNameChange}
            className="px-3 py-2 border rounded w-full"
            placeholder="Enter a name for the datalist"
          />

          <label className="font-medium">Select Column</label>
          <select
            value={selectedColumn}
            onChange={handleColumnSelect}
            className="px-3 py-2 border rounded w-full"
          >
            <option value="">-- Select a column --</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>

          {saveError && <div className="text-red-600 mb-2">{saveError}</div>}

          {selectedColumn && savePreview.length > 0 && (
            <div className="mb-2">
              <div className="text-gray-700 mb-1">
                Preview ({savePreview.length} entries):
              </div>
              <ul className="max-h-32 overflow-y-auto border rounded bg-white p-2 text-sm">
                {savePreview.slice(0, 10).map((val, idx) => (
                  <li key={idx} className="border-b last:border-b-0 py-1">
                    {val}
                  </li>
                ))}
                {savePreview.length > 10 && (
                  <li className="text-gray-400">
                    ...and {savePreview.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Datalist
          </button>
        </form>
      )}
    </div>
  );
}
