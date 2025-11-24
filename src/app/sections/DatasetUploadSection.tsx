// DatasetUploadSection.tsx
import React, { useState } from "react";
import Papa from "papaparse";

export default function DatasetUploadSection() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

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
      {csvData.length > 0 && (
        <div className="w-full max-w-3xl overflow-x-auto">
          <table className="min-w-full border rounded shadow text-gray-800">
            <thead className="bg-blue-100">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 border-b text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.slice(0, 20).map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}
                >
                  {headers.map((header) => (
                    <td key={header} className="px-3 py-2 border-b">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-gray-500 mt-2">Showing first 20 rows</div>
        </div>
      )}
    </div>
  );
}
