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
