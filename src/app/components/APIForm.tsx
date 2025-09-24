import { useState } from "react";
import PromptField from "../components/PromptField";
import AdditionalFields from "../components/AdditionalFields";
import ResultDisplay from "../components/ResultDisplay";
import SchemaField from "../components/SchemaField";

type APIFormProps = {
  setResult: (val: string) => void;
  setError: (val: string) => void;
};

export default function APIForm({ setResult, setError }: APIFormProps) {
  const [route, setRoute] = useState("");
  const [fields, setFields] = useState([
    { key: "", value: "", type: "string" },
  ]);
  const [method, setMethod] = useState("GET");
  const [field, setField] = useState("");
  const [schemaInput, setSchemaInput] = useState(""); // comma-separated
  const [loading, setLoading] = useState(false);

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

  const buildBody = () => {
    const obj: Record<string, any> = {};
    fields.forEach(({ key, value, type }, idx) => {
      if (!key) return;
      let parsed: any = value;
      if (idx !== 0) {
        if (type === "boolean") {
          parsed = value === "true";
        } else if (type === "number") {
          const num = Number(value);
          parsed = isNaN(num) ? value : num;
        }
      }
      obj[key] = parsed;
    });
    return obj;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    let parsedBody = {};
    if (method !== "GET") {
      parsedBody = buildBody();
    }
    // Parse schema input into array
    let schema: string[] | undefined = undefined;
    if (schemaInput.trim()) {
      schema = schemaInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-full"
    >
      <label className="font-medium">Request Method:</label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="border px-3 py-2 rounded bg-gray-900 text-white"
      >
        <option value="GET" className="bg-gray-900 text-white">
          GET
        </option>
        <option value="POST" className="bg-gray-900 text-white">
          POST
        </option>
        <option value="PUT" className="bg-gray-900 text-white">
          PUT
        </option>
        <option value="DELETE" className="bg-gray-900 text-white">
          DELETE
        </option>
        <option value="PATCH" className="bg-gray-900 text-white">
          PATCH
        </option>
      </select>
      <label className="font-medium">API Route (absolute or relative):</label>
      <input
        type="text"
        value={route}
        onChange={(e) => setRoute(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. https://jsonplaceholder.typicode.com/posts"
        required
      />
      <label className="font-medium">Field Name (optional):</label>
      <input
        type="text"
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. id"
      />
      <SchemaField value={schemaInput} onChange={setSchemaInput} />
      {method !== "GET" && (
        <>
          <PromptField
            keyName={fields[0].key}
            value={fields[0].value}
            onKeyChange={(val) => handleFieldChange(0, "key", val)}
            onValueChange={(val) => handleFieldChange(0, "value", val)}
          />
          <AdditionalFields
            fields={fields.slice(1)}
            onFieldChange={(idx, type, val) =>
              handleFieldChange(idx + 1, type, val)
            }
            onRemoveField={(idx) => handleRemoveField(idx + 1)}
            onAddField={handleAddField}
          />
        </>
      )}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Testing..." : "Send Request"}
      </button>
    </form>
  );
}
