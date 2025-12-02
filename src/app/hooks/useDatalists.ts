// useDatalists.ts
// Hook for fetching and managing datalists and their entries
import { useEffect, useState } from "react";

export type Datalist = { id: number; name: string };

export function useDatalists() {
  const [datalists, setDatalists] = useState<Datalist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/datalist")
      .then((res) => res.json())
      .then((data) => setDatalists(data))
      .catch(() => setError("Failed to fetch datalists"))
      .finally(() => setLoading(false));
  }, []);

  return { datalists, loading, error };
}

export function fetchDatalistEntries(id: number): Promise<string[]> {
  return fetch(`/api/datalist/${id}`)
    .then((res) => res.json())
    .then((data) => data.entries || data)
    .catch(() => []);
}
