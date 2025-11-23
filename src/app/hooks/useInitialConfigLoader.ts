// useInitialConfigLoader.ts
// Hook for loading initial configuration into form state

import { useEffect } from "react";
import { Field } from "./useFields";

type Header = { key: string; value: string };
type VariableValues = Record<string, string[]>;

export type InitialConfig = {
  id?: string;
  name?: string;
  route?: string;
  method?: string;
  field?: string;
  schema?: string;
  prompt?: string;
  headers?: string;
  additional_fields?: string;
  variables?: string;
};

interface UseInitialConfigLoaderProps {
  initialConfig?: InitialConfig;
  setRequestName: (val: string) => void;
  setRoute: (val: string) => void;
  setMethod: (val: string) => void;
  setField: (val: string) => void;
  setSchemaInput: (val: string) => void;
  setFields: React.Dispatch<React.SetStateAction<Field[]>>;
  setHeaders: React.Dispatch<React.SetStateAction<Header[]>>;
  setVariableValues: (values: VariableValues) => void;
}

export function useInitialConfigLoader({
  initialConfig,
  setRequestName,
  setRoute,
  setMethod,
  setField,
  setSchemaInput,
  setFields,
  setHeaders,
  setVariableValues,
}: UseInitialConfigLoaderProps) {
  useEffect(() => {
    if (!initialConfig) return;

    setRequestName(initialConfig.name || "");
    setRoute(initialConfig.route || "");
    setMethod(initialConfig.method || "GET");
    setField(initialConfig.field || "");

    // Handle schema
    setSchemaInput(
      initialConfig.schema
        ? (() => {
            try {
              return JSON.parse(initialConfig.schema).join(", ");
            } catch {
              return "";
            }
          })()
        : ""
    );

    // Load prompt as key-value pair for fields[0]
    if (initialConfig.prompt) {
      try {
        const parsedPrompt = JSON.parse(initialConfig.prompt);
        if (parsedPrompt && typeof parsedPrompt === "object") {
          const [[promptKey, promptValue]] = Object.entries(parsedPrompt);
          setFields((fields) => {
            const rest = fields.slice(1);
            return [
              { key: promptKey, value: String(promptValue), type: "string" },
              ...rest,
            ];
          });
        }
      } catch {
        // fallback: keep existing prompt field
      }
    }

    // Load headers
    if (initialConfig.headers) {
      try {
        const parsedHeaders = JSON.parse(initialConfig.headers);
        if (parsedHeaders && typeof parsedHeaders === "object") {
          setHeaders(
            Object.entries(parsedHeaders).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          );
        } else {
          setHeaders([]);
        }
      } catch {
        setHeaders([]);
      }
    }

    // Load additional_fields as array for UI
    if (initialConfig.additional_fields) {
      try {
        const parsedFields = JSON.parse(initialConfig.additional_fields);
        if (parsedFields && typeof parsedFields === "object") {
          setFields((fields) => {
            // Keep prompt field as first
            const promptField = fields[0] || {
              key: "prompt",
              value: "",
              type: "string",
            };
            const additionalArray = Object.entries(parsedFields).map(
              ([key, value]) => ({
                key,
                value: String(value),
                type: typeof value,
              })
            );
            return [promptField, ...additionalArray];
          });
        }
      } catch {
        setFields((fields) => [fields[0]]);
      }
    }

    // Load variables as object { var1: [val1, val2], ... }
    if (initialConfig.variables) {
      try {
        const parsedVariables = JSON.parse(initialConfig.variables);
        if (parsedVariables && typeof parsedVariables === "object") {
          setVariableValues(parsedVariables);
        }
      } catch {
        setVariableValues({});
      }
    }
  }, [
    initialConfig,
    setRequestName,
    setRoute,
    setMethod,
    setField,
    setSchemaInput,
    setFields,
    setHeaders,
    setVariableValues,
  ]);
}
