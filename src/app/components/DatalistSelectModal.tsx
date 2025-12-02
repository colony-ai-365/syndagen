// DatalistSelectModal.tsx
// Modal for paginated selection of datalist entries
import React, { useEffect, useState } from "react";

export type DatalistSelectModalProps = {
  datalistId: number;
  open: boolean;
  onClose: () => void;
  onSelect: (value: string, index: number) => void;
  selectedIndex?: number;
};

const PAGE_SIZE = 10;

export default function DatalistSelectModal({
  datalistId,
  open,
  onClose,
  onSelect,
  selectedIndex,
}: DatalistSelectModalProps) {
  const [entries, setEntries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputPage, setInputPage] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/datalist/${datalistId}?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [datalistId, page, open]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePageJump = () => {
    const num = Number(inputPage);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setPage(num);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Select Datalist Entry</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div className="flex gap-2 items-center mb-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border rounded"
          >
            Prev
          </button>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            className="border px-2 py-1 rounded w-16 text-center"
            placeholder={String(page)}
          />
          <button onClick={handlePageJump} className="px-2 py-1 border rounded">
            Go
          </button>
          <span className="mx-2">/ {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 border rounded"
          >
            Next
          </button>
        </div>
        <div className="overflow-y-auto flex-1 border rounded p-2 mb-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center text-gray-500">No entries found.</div>
          ) : (
            <ul className="divide-y">
              {entries.map((entry, idx) => (
                <li
                  key={idx}
                  className={`py-2 px-2 cursor-pointer ${
                    selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => onSelect(entry, (page - 1) * PAGE_SIZE + idx)}
                >
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
