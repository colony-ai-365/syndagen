// formHelpers.ts
// Helper functions for building payloads and processing form data

import { Field } from "../hooks/useFields";

export type Header = { key: string; value: string };
export type VariableSource = {
  type: "manual" | "datalist";
  values?: string[];
  datalistId?: number;
};
export type VariableValues = Record<string, VariableSource>;

export function buildConfigPayload(
  fields: Field[],
  headers: Header[],
  schemaInput: string,
  requestName: string,
  route: string,
  method: string,
  field: string,
  variableValues: VariableValues
) {
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

  // Save prompt as key-value pair object
  const promptObj: Record<string, any> = {};
  if (fields[0]?.key) {
    promptObj[fields[0].key] = fields[0].value;
  }

  // Save headers as object for DB/API
  const headersObject: Record<string, string> = {};
  if (Array.isArray(headers)) {
    headers.forEach(({ key, value }) => {
      if (key) headersObject[key] = value;
    });
  }

  // Parse schema input into array
  let schema: string[] | undefined = undefined;
  if (schemaInput.trim()) {
    schema = schemaInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Strip values array from datalist variables before saving to DB
  const variablesForDB: VariableValues = {};
  Object.entries(variableValues).forEach(([key, source]) => {
    if (source.type === "datalist") {
      // Only save type and datalistId for datalist variables
      variablesForDB[key] = {
        type: "datalist",
        datalistId: source.datalistId,
      };
    } else {
      // Save everything for manual variables
      variablesForDB[key] = source;
    }
  });

  return {
    name: requestName,
    route,
    method,
    field,
    prompt: promptObj,
    additional_fields: additionalFieldsObj,
    variables: variablesForDB,
    headers: headersObject,
    schema,
  };
}

export function buildBody(
  fields: Field[],
  getInjectedPrompt: () => string
): Record<string, any> {
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
}

export function parseSchemaInput(schemaInput: string): string[] | undefined {
  if (!schemaInput.trim()) return undefined;
  return schemaInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildHeadersObject(headers: Header[]): Record<string, string> {
  const customHeaders: Record<string, string> = {};
  headers.forEach(({ key, value }) => {
    if (key) customHeaders[key] = value;
  });
  return customHeaders;
}
