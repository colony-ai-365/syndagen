// usePromptVariables.ts
// Custom hook for managing prompt variable detection and injection
import { useState, useEffect } from "react";

export function usePromptVariables(prompt: string) {
  const variableRegex = /{{\s*([\w.-]+)\s*}}/g;
  const [variables, setVariables] = useState<string[]>([]);

  useEffect(() => {
    const found = Array.from(
      new Set([...prompt.matchAll(variableRegex)].map((m) => m[1]))
    );
    setVariables(found);
  }, [prompt]);

  // Inject selected values into prompt
  function injectVariables(
    variableValues: Record<string, string[]>,
    variableSelections: Record<string, number>
  ) {
    let injected = prompt;
    for (const v of variables) {
      const vals = variableValues[v] || [""];
      const idx = variableSelections[v] ?? 0;
      const selectedValue = vals[idx] || "";
      injected = injected.replace(
        new RegExp(`{{\\s*${v}\\s*}}`, "g"),
        selectedValue
      );
    }
    return injected;
  }

  return { variables, injectVariables };
}
