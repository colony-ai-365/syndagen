// APIForm.tsx
// Main form component for building and sending API requests. Uses custom hooks for managing fields, headers, and prompt variables.
import { useState, useEffect } from "react";
import { useFields, useHeaders } from "../hooks/useFields";
import { usePromptVariables } from "../hooks/usePromptVariables";
import PromptField from "../components/PromptField";
import AdditionalFields from "../components/AdditionalFields";
import ResultDisplay from "../components/ResultDisplay";
import SchemaField from "../components/SchemaField";
import RequestMetaSection from "./RequestMetaSection";
import HeadersSection from "./HeadersSection";
import PromptSection from "./PromptSection";
import BodyFieldsSection from "./BodyFieldsSection";
import ActionButtonsSection from "./ActionButtonsSection";

type APIFormProps = {
  setResult: (val: string) => void;
  setError: (val: string) => void;
  initialConfig?: any;
};

export default function APIForm({ setResult, setError }: APIFormProps) {
  // Save changes to request config
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Helper to build DB payload
  const buildConfigPayload = () => {
    // Map fields to DB structure
    const additionalFieldsObj: Record<string, any> = {};
    fields.slice(1).forEach(({ key, value, type }) => {
      if (!key) return;
      let parsed: any = value;
      if (type === "boolean") {
        parsed = value === "true";
      } else if (type === "number") {
        const num = Number(value);
        parsed = isNaN(num) ? value : num;
      }
      additionalFieldsObj[key] = parsed;
    });
    // Save headers as array of { key, value } objects
    const headersArray = Array.isArray(headers) ? headers : [];
    // Parse schema input into array
    let schema: string[] | undefined = undefined;
    if (schemaInput.trim()) {
      schema = schemaInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return {
      name: requestName,
      route,
      method,
      field,
      prompt: fields[0]?.value || "",
      additional_fields: additionalFieldsObj,
      variables: variableValues,
      headers: headersArray,
      schema,
    };
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    setSaveLoading(true);
    setSaveMessage("");
    try {
      // Assume initialConfig.id is available for edit
      const id = arguments[0]?.initialConfig?.id;
      if (!id) {
        setSaveMessage("No config ID found.");
        setSaveLoading(false);
        return;
      }
      const payload = buildConfigPayload();
      const res = await fetch(`/api/request-config/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage("Changes saved successfully.");
      } else {
        setSaveMessage(data.error || "Failed to save changes.");
      }
    } catch (err) {
      setSaveMessage("Failed to save changes.");
    }
    setSaveLoading(false);
  };
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
        const parsedHeaders = JSON.parse(initialConfig.headers);
        setHeaders(Array.isArray(parsedHeaders) ? parsedHeaders : []);
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
      <RequestMetaSection
        requestName={requestName}
        method={method}
        setMethod={setMethod}
        route={route}
        setRoute={setRoute}
        field={field}
        setField={setField}
        schemaInput={schemaInput}
        setSchemaInput={setSchemaInput}
      />
      <HeadersSection
        headers={headers}
        handleHeaderChange={handleHeaderChange}
        handleRemoveHeader={handleRemoveHeader}
        handleAddHeader={handleAddHeader}
      />
      {method !== "GET" && (
        <>
          <PromptSection
            fields={fields}
            handleFieldChange={handleFieldChange}
            variableSelections={variableSelections}
            setVariableSelections={setVariableSelections}
            variableValues={variableValues}
            setVariableValues={setVariableValues}
          />
          <BodyFieldsSection
            fields={fields}
            handleFieldChange={handleFieldChange}
            handleRemoveField={handleRemoveField}
            handleAddField={handleAddField}
          />
        </>
      )}
      <ActionButtonsSection
        loading={loading}
        handleSubmit={handleSubmit}
        saveLoading={saveLoading}
        handleSaveChanges={handleSaveChanges}
        initialConfig={arguments[0]?.initialConfig}
        saveMessage={saveMessage}
      />
    </form>
  );
}
