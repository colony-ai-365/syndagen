// PromptField.tsx
// Component for editing the prompt and managing dynamic variables. Uses usePromptVariables hook for variable detection.
import { useRef } from "react";
import { usePromptVariables } from "../hooks/usePromptVariables";

type PromptFieldProps = {
  keyName: string;
  value: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
  variableSelections?: Record<string, number>;
  setVariableSelections?: (sel: Record<string, number>) => void;
  variableValues?: Record<string, string[]>;
  setVariableValues?: (vals: Record<string, string[]>) => void;
};

export default function PromptField({
  keyName,
  value,
  onKeyChange,
  onValueChange,
  variableSelections,
  setVariableSelections,
  variableValues,
  setVariableValues,
}: PromptFieldProps) {
  // Use custom hook for variable detection in the prompt string
  const { variables } = usePromptVariables(value);
  // Ref for selection index (not used for state, just for scroll sync)
  const selectionsRef = useRef<Record<string, number>>({});
  // Refs for textarea and preview div to sync scroll positions
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Highlight variables in the prompt preview using a span
  const getHighlightedPrompt = () => {
    if (!value) return "";
    // Replace all {{variable}} with highlighted span
    return value.replace(/{{\s*([\w.-]+)\s*}}/g, (match) => {
      return `<span style='color: orange; font-weight: bold;'>${match}</span>`;
    });
  };

  // Sync scroll position between textarea and preview
  const handleScroll = () => {
    if (textareaRef.current && previewRef.current) {
      previewRef.current.scrollTop = textareaRef.current.scrollTop;
      previewRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <label className="font-bold text-lg mb-2">Prompt</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={keyName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onKeyChange(e.target.value)
          }
          className="border px-2 py-1 rounded font-mono w-1/6"
          placeholder="key"
        />
        <div className="relative w-full">
          {/* Highlight preview layer */}
          <div
            ref={previewRef}
            className="absolute left-0 top-0 w-full h-full pointer-events-none px-3 py-2 rounded font-mono min-h-[120px] text-base whitespace-pre-wrap break-words resize-none"
            style={{
              color: "inherit",
              background: "transparent",
              zIndex: 1,
              overflow: "hidden",
              border: "1px solid transparent",
              boxSizing: "border-box",
            }}
            dangerouslySetInnerHTML={{ __html: getHighlightedPrompt() }}
          />
          {/* Main textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onValueChange(e.target.value)
            }
            onScroll={handleScroll}
            className="border px-3 py-2 rounded font-mono w-full min-h-[120px] resize-y text-base relative"
            style={{
              position: "relative",
              zIndex: 2,
              background: "transparent",
              color: "transparent", // hide text
              caretColor: "white", // show blinking caret
              borderColor: "white", // show border --- IGNORE ---
            }}
            placeholder="Enter your prompt here..."
          />
        </div>
      </div>

      {/* Dynamic variable inputs: list of values for each variable detected in the prompt */}
      {variables.length > 0 && (
        <div className="mt-2">
          <label className="font-semibold text-base mb-1 block">
            Dynamic Variables (enter comma-separated values):
          </label>
          <div className="flex flex-col gap-2">
            {variables.map((v) => (
              <div key={v} className="flex gap-2 items-center">
                <span className="font-mono text-orange-600">{v}</span>
                <input
                  type="text"
                  value={
                    variableValues ? variableValues[v]?.join(",") || "" : ""
                  }
                  onChange={(e) => {
                    // Split input into array of values for this variable
                    const vals = e.target.value.split(",");
                    if (setVariableValues && variableValues) {
                      setVariableValues({ ...variableValues, [v]: vals });
                    }
                    // Always update selection to 0 if values change
                    if (setVariableSelections) {
                      setVariableSelections({
                        ...(variableSelections || {}),
                        [v]: 0,
                      });
                    }
                  }}
                  className="border px-2 py-1 rounded w-2/3"
                  placeholder={`Values for ${v} (comma separated)`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropdowns for selecting which value to inject for each variable */}
      {variables.length > 0 && (
        <div className="mt-2">
          <label className="font-semibold text-base mb-1 block">
            Select value for each variable:
          </label>
          <div className="flex flex-col gap-2">
            {variables.map((v) => (
              <div key={v} className="flex gap-2 items-center">
                <span className="font-mono text-orange-600">{v}</span>
                <select
                  value={variableSelections ? variableSelections[v] ?? 0 : 0}
                  onChange={(e) => {
                    // Update selection index for this variable
                    const idx = Number(e.target.value);
                    if (setVariableSelections) {
                      setVariableSelections({
                        ...(variableSelections || {}),
                        [v]: idx,
                      });
                    }
                  }}
                  className="border px-2 py-1 rounded w-2/3"
                >
                  {(variableValues ? variableValues[v] || [""] : [""]).map(
                    (val, idx) => (
                      <option key={idx} value={idx}>
                        {val}
                      </option>
                    )
                  )}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
