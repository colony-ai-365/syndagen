// useFormSubmit.ts
// Hook for handling form submission to test API

import { useState } from "react";
import { parseSchemaInput, buildHeadersObject } from "../utils/formHelpers";
import { Header } from "../utils/formHelpers";

export function useFormSubmit(
  setResult: (val: string) => void,
  setError: (val: string) => void
) {
  const [loading, setLoading] = useState(false);

  const submitForm = async (
    route: string,
    method: string,
    field: string,
    schemaInput: string,
    headers: Header[],
    buildBodyFn: () => Record<string, any>
  ) => {
    setLoading(true);
    setError("");
    setResult("");

    let parsedBody = {};
    if (method !== "GET") {
      parsedBody = buildBodyFn();
    }

    const schema = parseSchemaInput(schemaInput);
    const customHeaders = buildHeadersObject(headers);

    try {
      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          body: parsedBody,
          method,
          field,
          schema,
          headers: customHeaders,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Validation failed");
      }
    } catch (err) {
      setError("Failed to call backend");
    }
    setLoading(false);
  };

  return {
    loading,
    submitForm,
  };
}
