// APIForm.tsx
// Main form component for building and sending API requests. Uses custom hooks for managing fields, headers, and prompt variables.
import { useState, useEffect } from "react";
import { useFields, useHeaders } from "../hooks/useFields";
import { usePromptVariables } from "../hooks/usePromptVariables";
import PromptField from "../components/PromptField";
import AdditionalFields from "../components/AdditionalFields";
import ResultDisplay from "../components/ResultDisplay";
import SchemaField from "../components/SchemaField";

type APIFormProps = {
  setResult: (val: string) => void;
  setError: (val: string) => void;
  initialConfig?: any;
};

export default function APIForm({ setResult, setError }: APIFormProps) {
  // State for prompt variables
  const [variableSelections, setVariableSelections] = useState<
    Record<string, number>
  >({});
  const [variableValues, setVariableValues] = useState<
    Record<string, string[]>
  >({});
  const [route, setRoute] = useState<string>("");
  const [method, setMethod] = useState<string>("GET");
  const [field, setField] = useState<string>("");
  const [schemaInput, setSchemaInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // Request name state (for edit/[id] page)
  const [requestName, setRequestName] = useState<string>("");

  // Use initialConfig from props
  // Only runs once on mount or when initialConfig changes
  // UseEffect must be at top level
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!arguments[0] || !arguments[0].initialConfig) return;
    const initialConfig = arguments[0].initialConfig;
    setRequestName(initialConfig.name || "");
    setRoute(initialConfig.route || "");
    setMethod(initialConfig.method || "GET");
    setField(initialConfig.field || "");
    setSchemaInput(
      initialConfig.schema
        ? Array.isArray(initialConfig.schema)
          ? initialConfig.schema.join(", ")
          : (() => {
              try {
                return JSON.parse(initialConfig.schema).join(", ");
              } catch {
                return "";
              }
            })()
        : ""
    );
    // Optionally load headers, variables, etc.
    if (initialConfig.headers) {
      try {
        setHeaders(JSON.parse(initialConfig.headers));
      } catch {
        setHeaders([]);
      }
    }
    // ...other fields as needed
  }, [arguments[0]?.initialConfig]);

  // Fetch request name if available from global/window (for edit/[id] page)
  // This is a placeholder; actual implementation should fetch config by id and set name
  // For now, just show a field at the top

  // Use custom hooks for fields and headers
  const {
    fields,
    setFields,
    handleFieldChange,
    handleAddField,
    handleRemoveField,
  } = useFields();
  const {
    headers,
    setHeaders,
    handleHeaderChange,
    handleAddHeader,
    handleRemoveHeader,
  } = useHeaders();

  // Use custom hook for prompt variables
  const { injectVariables } = usePromptVariables(fields[0].value);

  // Helper to get injected prompt value from PromptField
  const getInjectedPrompt = () => {
    const injected = injectVariables(variableValues, variableSelections);
    return injected;
  };

  // Build request body
  const buildBody = () => {
    const obj: Record<string, any> = {};
    fields.forEach(({ key, value, type }, idx) => {
      if (!key) return;
      let parsed: any = value;
      // For the prompt field (idx === 0), use injected prompt value
      if (idx === 0) {
        const injected = getInjectedPrompt();
        try {
          parsed = JSON.parse(injected);
        } catch {
          parsed = injected;
        }
      } else {
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

  // Handle form submit
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
    // Build headers object
    const customHeaders: Record<string, string> = {};
    headers.forEach(({ key, value }) => {
      if (key) customHeaders[key] = value;
    });
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-full"
    >
      {/* Request Name field (read-only for now) */}
      <label className="font-medium">Request Name:</label>
      <input
        type="text"
        value={requestName}
        onChange={() => {}}
        className="border px-3 py-2 rounded bg-gray-100 text-gray-700"
        placeholder="Request name"
        readOnly
      />
      {/* ...existing code... */}
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
      {/* ...existing code... */}
      <label className="font-medium">API Route (absolute or relative):</label>
      <input
        type="text"
        value={route}
        onChange={(e) => setRoute(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. https://jsonplaceholder.typicode.com/posts"
        required
      />
      {/* ...existing code... */}
      <label className="font-medium">Field Name (optional):</label>
      <input
        type="text"
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. id"
      />
      {/* ...existing code... */}
      <label className="font-medium">Custom Headers:</label>
      <AdditionalFields
        fields={headers}
        onFieldChange={handleHeaderChange}
        onRemoveField={handleRemoveHeader}
        onAddField={handleAddHeader}
        hideType={true}
      />
      <SchemaField value={schemaInput} onChange={setSchemaInput} />
      {method !== "GET" && (
        <>
          <PromptField
            keyName={fields[0].key}
            value={fields[0].value}
            onKeyChange={(val) => handleFieldChange(0, "key", val)}
            onValueChange={(val) => handleFieldChange(0, "value", val)}
            variableSelections={variableSelections}
            setVariableSelections={setVariableSelections}
            variableValues={variableValues}
            setVariableValues={setVariableValues}
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
