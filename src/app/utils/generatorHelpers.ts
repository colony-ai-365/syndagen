export async function getFirstVariableValues(variablesObj: any) {
  const result: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(variablesObj || {})) {
    const v = val as any;
    if (v.type === "manual" && Array.isArray(v.values) && v.values.length > 0) {
      result[key] = [v.values[0]];
    } else if (v.type === "datalist" && v.datalistId) {
      try {
        const res = await fetch(`/api/datalist/${v.datalistId}/first`);
        const data = await res.json();
        if (data.value) result[key] = [data.value];
        else result[key] = [""];
      } catch {
        result[key] = [""];
      }
    } else {
      result[key] = [""];
    }
  }
  return result;
}

type VariableSource =
  | { type: "manual"; values?: string[] }
  | { type: "datalist"; datalistId?: number };

export type VariableValuesMap = Record<string, string[]>;

export function parseVariablesObj(config: any): Record<string, VariableSource> {
  try {
    return (JSON.parse(config?.variables || "{}") || {}) as Record<
      string,
      VariableSource
    >;
  } catch {
    return {};
  }
}

export function computeMaxCombinations(
  variableLengths: Record<string, number>
) {
  const lengths = Object.values(variableLengths);
  if (lengths.length === 0) return 0;
  if (lengths.some((n) => !Number.isFinite(n) || n <= 0)) return 0;
  return lengths.reduce((acc, n) => acc * n, 1);
}

// Convert 1-based combination number to per-variable indices (0-based), mixed-radix.
// Order is based on `variableNames`.
export function combinationNumberToIndices(
  combinationNumber: number,
  variableNames: string[],
  variableLengths: Record<string, number>
) {
  const indices: Record<string, number> = {};
  if (combinationNumber < 1) return indices;
  let n = combinationNumber - 1;

  // Least significant dimension = last variable
  for (let i = variableNames.length - 1; i >= 0; i--) {
    const name = variableNames[i];
    const base = variableLengths[name] ?? 0;
    if (base <= 0) {
      indices[name] = 0;
      continue;
    }
    indices[name] = n % base;
    n = Math.floor(n / base);
  }

  return indices;
}

export async function getNthDatalistValue(datalistId: number, n: number) {
  // `nth` is assumed to be 1-based on the API route implementation
  const res = await fetch(`/api/datalist/${datalistId}/nth?n=${n}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch datalist ${datalistId} nth=${n}`);
  }
  const data = await res.json();
  return (data?.value ?? "") as string;
}

// Build variableValues map for a given combinationNumber (1..max)
export async function buildVariableValuesForCombination(
  config: any,
  variableLengths: Record<string, number>,
  combinationNumber: number
): Promise<{
  variableValues: VariableValuesMap;
  inputs: Record<string, string>;
}> {
  const variablesObj = parseVariablesObj(config);
  const variableNames = Object.keys(variablesObj);
  const indices = combinationNumberToIndices(
    combinationNumber,
    variableNames,
    variableLengths
  );

  const variableValues: VariableValuesMap = {};
  const inputs: Record<string, string> = {};

  for (const name of variableNames) {
    const src = variablesObj[name];
    const idx = indices[name] ?? 0;

    if (src?.type === "manual") {
      const vals = Array.isArray((src as any).values)
        ? (src as any).values
        : [];
      const selected = (vals[idx] ?? "") as string;
      variableValues[name] = [selected];
      inputs[name] = selected;
      continue;
    }

    if (src?.type === "datalist") {
      const datalistId = (src as any).datalistId as number | undefined;
      const selected = datalistId
        ? await getNthDatalistValue(datalistId, idx + 1)
        : "";
      variableValues[name] = [selected];
      inputs[name] = selected;
      continue;
    }

    variableValues[name] = [""];
    inputs[name] = "";
  }

  return { variableValues, inputs };
}

export function injectVariables(
  prompt: string,
  variableValues: Record<string, string[]>
) {
  return prompt.replace(/{{\s*([\w.-]+)\s*}}/g, (match, v) => {
    const vals = variableValues[v] || [""];
    return vals[0] || "";
  });
}

export function buildTestBody(config: any, injectedPrompt: string) {
  const fields = [];
  const promptKey =
    Object.keys(JSON.parse(config.prompt || "{}"))[0] || "prompt";
  fields.push({ key: promptKey, value: injectedPrompt, type: "string" });
  const additional = JSON.parse(config.additional_fields || "{}");
  for (const [key, value] of Object.entries(additional)) {
    fields.push({ key, value: String(value), type: typeof value });
  }
  const obj: Record<string, any> = {};
  fields.forEach(({ key, value, type }, idx) => {
    if (!key) return;
    let parsed: any = value;
    if (idx === 0) {
      parsed = value;
    } else {
      if (type === "boolean") parsed = value === "true";
      else if (type === "number") {
        const num = Number(value);
        parsed = isNaN(num) ? value : num;
      }
    }
    obj[key] = parsed;
  });
  return obj;
}

// Helper to get variable lengths
export async function getVariableLengths(
  config: any
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (!config?.variables) return result;
  const variablesObj = JSON.parse(config.variables || "{}");
  await Promise.all(
    Object.entries(variablesObj).map(async ([key, val]) => {
      const v = val as any;
      if (v.type === "manual" && Array.isArray(v.values)) {
        result[key] = v.values.length;
      } else if (v.type === "datalist" && v.datalistId) {
        try {
          const res = await fetch(`/api/datalist/${v.datalistId}/count`);
          const data = await res.json();
          result[key] = data.count ?? 0;
        } catch {
          result[key] = 0;
        }
      } else {
        result[key] = 0;
      }
    })
  );
  return result;
}
