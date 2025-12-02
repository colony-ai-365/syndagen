// APIForm.tsx
// Main form component for building and sending API requests. Uses custom hooks for managing fields, headers, and prompt variables.
import { useState } from "react";
import { useFields, useHeaders } from "../hooks/useFields";
import { usePromptVariables } from "../hooks/usePromptVariables";
import {
  useInitialConfigLoader,
  InitialConfig,
} from "../hooks/useInitialConfigLoader";
import { useSaveConfig } from "../hooks/useSaveConfig";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { buildConfigPayload, buildBody } from "../utils/formHelpers";
import RequestMetaSection from "./RequestMetaSection";
import HeadersSection from "./HeadersSection";
import PromptSection from "./PromptSection";
import BodyFieldsSection from "./BodyFieldsSection";
import ActionButtonsSection from "./ActionButtonsSection";

type VariableSource = {
  type: "manual" | "datalist";
  values: string[];
  datalistId?: number;
};
type VariableValues = Record<string, VariableSource>;

type APIFormProps = {
  setResult: (val: string) => void;
  setError: (val: string) => void;
  initialConfig?: InitialConfig;
};

export default function APIForm({
  setResult,
  setError,
  initialConfig,
}: APIFormProps) {
  // State management
  const [variableSelections, setVariableSelections] = useState<
    Record<string, number>
  >({});
  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const [route, setRoute] = useState<string>("");
  const [method, setMethod] = useState<string>("GET");
  const [field, setField] = useState<string>("");
  const [schemaInput, setSchemaInput] = useState<string>("");
  const [requestName, setRequestName] = useState<string>("");

  // Custom hooks for fields and headers
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

  // Custom hook for prompt variables
  const { injectVariables } = usePromptVariables(fields[0]?.value || "");

  // Custom hooks for save and submit functionality
  const { saveLoading, saveMessage, saveConfig } = useSaveConfig();
  const { loading, submitForm } = useFormSubmit(setResult, setError);

  // Load initial config
  useInitialConfigLoader({
    initialConfig,
    setRequestName,
    setRoute,
    setMethod,
    setField,
    setSchemaInput,
    setFields,
    setHeaders,
    setVariableValues,
  });

  // Helper to get injected prompt value
  const getInjectedPrompt = () => {
    // Convert VariableValues to Record<string, string[]> for injection
    const simpleValues: Record<string, string[]> = {};
    Object.entries(variableValues).forEach(([key, src]) => {
      simpleValues[key] = src.values;
    });
    return injectVariables(simpleValues, variableSelections);
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    const payload = buildConfigPayload(
      fields,
      headers,
      schemaInput,
      requestName,
      route,
      method,
      field,
      variableValues
    );
    await saveConfig(initialConfig?.id, payload);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(route, method, field, schemaInput, headers, () =>
      buildBody(fields, getInjectedPrompt)
    );
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
        initialConfig={initialConfig}
        saveMessage={saveMessage}
      />
    </form>
  );
}
