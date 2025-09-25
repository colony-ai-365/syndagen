// useFields.ts
// Custom hook for managing dynamic fields and headers in APIForm
import { useState } from "react";

export type Field = { key: string; value: string; type?: string };

export function useFields(
  initialFields: Field[] = [{ key: "", value: "", type: "string" }]
) {
  const [fields, setFields] = useState<Field[]>(initialFields);

  const handleFieldChange = (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => {
    setFields((fields) =>
      fields.map((f, i) => (i === idx ? { ...f, [fieldType]: val } : f))
    );
  };

  const handleAddField = () => {
    setFields((fields) => [...fields, { key: "", value: "", type: "string" }]);
  };

  const handleRemoveField = (idx: number) => {
    if (idx === 0) return;
    setFields((fields) => fields.filter((_, i) => i !== idx));
  };

  return {
    fields,
    setFields,
    handleFieldChange,
    handleAddField,
    handleRemoveField,
  };
}

export function useHeaders(initialHeaders = [{ key: "", value: "" }]) {
  const [headers, setHeaders] = useState(initialHeaders);

  const handleHeaderChange = (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => {
    if (fieldType === "type") return; // ignore type for headers
    setHeaders((headers) =>
      headers.map((h, i) => (i === idx ? { ...h, [fieldType]: val } : h))
    );
  };

  const handleAddHeader = () => {
    setHeaders((headers) => [...headers, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (idx: number) => {
    if (idx === 0) return;
    setHeaders((headers) => headers.filter((_, i) => i !== idx));
  };

  return {
    headers,
    setHeaders,
    handleHeaderChange,
    handleAddHeader,
    handleRemoveHeader,
  };
}
