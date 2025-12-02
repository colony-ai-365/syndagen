// PromptField.tsx
// Component for editing the prompt and managing dynamic variables. Uses usePromptVariables hook for variable detection.
import { useRef, useEffect, useState } from "react";
import { usePromptVariables } from "../hooks/usePromptVariables";
import { useDatalists, fetchDatalistEntries } from "../hooks/useDatalists";

import { VariableValues } from "../utils/formHelpers";
import DatalistSelectModal from "./DatalistSelectModal";

type PromptFieldProps = {
  keyName: string;
  value: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
  variableSelections?: Record<string, number>;
  setVariableSelections?: (sel: Record<string, number>) => void;
  variableValues?: VariableValues;
  setVariableValues?: (vals: VariableValues) => void;
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
  // Datalist hook
  const { datalists } = useDatalists();
  // Track loading datalist entries per variable
  const [loadingEntries, setLoadingEntries] = useState<Record<string, boolean>>(
    {}
  );
  // Modal state: which variable is open for selection
  const [modalVar, setModalVar] = useState<string | null>(null);
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
    <div className="flex flex-col gap-2 mb-4 p-4 border rounded bg-gray-50">
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
            className="absolute left-0 top-0 w-full h-full pointer-events-none px-3 py-2 rounded font-mono min-h-[120px] text-base whitespace-pre-wrap wrap-break-word resize-none"
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
              caretColor: "black", // show blinking caret
              borderColor: "black", // show border --- IGNORE ---
            }}
            placeholder="Enter your prompt here..."
          />
        </div>
      </div>

      {/* Dynamic variable inputs: source selection and values for each variable detected in the prompt */}
      {variables.length > 0 && (
        <div className="mt-2">
          <label className="font-semibold text-base mb-1 block">
            Dynamic Variables (choose source and values):
          </label>
          <div className="flex flex-col gap-2">
            {variables.map((v) => {
              const sourceType =
                variableValues && variableValues[v]
                  ? variableValues[v].type
                  : "manual";
              const datalistId =
                variableValues && variableValues[v]
                  ? variableValues[v].datalistId
                  : undefined;
              return (
                <div key={v} className="flex gap-2 items-center">
                  <span className="font-mono text-orange-600">{v}</span>
                  <select
                    value={sourceType}
                    onChange={(e) => {
                      const newType = e.target.value as "manual" | "datalist";
                      if (setVariableValues && variableValues) {
                        setVariableValues({
                          ...variableValues,
                          [v]: {
                            type: newType,
                            values: [],
                          },
                        });
                      }
                    }}
                    className="border px-2 py-1 rounded"
                  >
                    <option value="manual">Manual</option>
                    <option value="datalist">Datalist</option>
                  </select>
                  {sourceType === "manual" ? (
                    <input
                      type="text"
                      value={
                        variableValues && variableValues[v]
                          ? variableValues[v].values.join(",")
                          : ""
                      }
                      onChange={(e) => {
                        const vals = e.target.value.split(",");
                        if (setVariableValues && variableValues) {
                          setVariableValues({
                            ...variableValues,
                            [v]: {
                              type: "manual",
                              values: vals,
                            },
                          });
                        }
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
                  ) : (
                    <>
                      <select
                        value={datalistId ?? ""}
                        onChange={async (e) => {
                          const id = Number(e.target.value);
                          setLoadingEntries((le) => ({ ...le, [v]: true }));
                          const entries = await fetchDatalistEntries(id);
                          setLoadingEntries((le) => ({ ...le, [v]: false }));
                          if (setVariableValues && variableValues) {
                            setVariableValues({
                              ...variableValues,
                              [v]: {
                                type: "datalist",
                                datalistId: id,
                                values: entries,
                              },
                            });
                          }
                          if (setVariableSelections) {
                            setVariableSelections({
                              ...(variableSelections || {}),
                              [v]: 0,
                            });
                          }
                        }}
                        className="border px-2 py-1 rounded"
                      >
                        <option value="">Select datalist</option>
                        {datalists.map((dl) => (
                          <option key={dl.id} value={dl.id}>
                            {dl.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="ml-2 px-2 py-1 border rounded bg-blue-50 hover:bg-blue-100"
                        disabled={!datalistId}
                        onClick={() => setModalVar(v)}
                      >
                        Select value...
                      </button>
                      {modalVar === v && datalistId && (
                        <DatalistSelectModal
                          datalistId={datalistId}
                          open={modalVar === v}
                          onClose={() => setModalVar(null)}
                          selectedIndex={
                            variableSelections
                              ? variableSelections[v]
                              : undefined
                          }
                          onSelect={(entry, idx) => {
                            // Set selection index
                            if (setVariableSelections) {
                              setVariableSelections({
                                ...(variableSelections || {}),
                                [v]: idx,
                              });
                            }
                            setModalVar(null);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropdowns for selecting which value to inject for each variable, and select value modal for datalist */}
      {variables.length > 0 && (
        <div className="mt-2">
          <label className="font-semibold text-base mb-1 block">
            Select value for each variable:
          </label>
          <div className="flex flex-col gap-2">
            {variables.map((v) => {
              const sourceType =
                variableValues && variableValues[v]
                  ? variableValues[v].type
                  : "manual";
              const datalistId =
                variableValues && variableValues[v]
                  ? variableValues[v].datalistId
                  : undefined;
              const selectedIdx = variableSelections
                ? variableSelections[v] ?? 0
                : 0;
              const selectedValue =
                variableValues &&
                variableValues[v] &&
                variableValues[v].values[selectedIdx];
              return (
                <div key={v} className="flex gap-2 items-center">
                  <span className="font-mono text-orange-600">{v}</span>
                  {sourceType === "datalist" ? (
                    <>
                      <button
                        type="button"
                        className="ml-2 px-2 py-1 border rounded bg-blue-50 hover:bg-blue-100"
                        disabled={!datalistId}
                        onClick={() => setModalVar(v)}
                      >
                        Select value...
                      </button>
                      {selectedValue && (
                        <span className="ml-2 text-green-700">
                          Selected: {selectedValue}
                        </span>
                      )}
                      {modalVar === v && datalistId && (
                        <DatalistSelectModal
                          datalistId={datalistId}
                          open={modalVar === v}
                          onClose={() => setModalVar(null)}
                          selectedIndex={selectedIdx}
                          onSelect={(entry, idx) => {
                            if (setVariableSelections) {
                              setVariableSelections({
                                ...(variableSelections || {}),
                                [v]: idx,
                              });
                            }
                            setModalVar(null);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <select
                      value={selectedIdx}
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
                      {(variableValues && variableValues[v]
                        ? variableValues[v].values
                        : [""]
                      ).map((val: string, idx: number) => (
                        <option key={idx} value={idx}>
                          {val}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
