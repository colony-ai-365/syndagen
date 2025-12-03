// VariableConfiguration.tsx
// Component for configuring variable sources and selecting values
import { useDatalists } from "../hooks/useDatalists";
import { VariableValues } from "../utils/formHelpers";
import DatalistSelectModal from "./DatalistSelectModal";

type VariableConfigurationProps = {
  variables: string[];
  variableValues?: VariableValues;
  variableSelections?: Record<string, number>;
  modalVar: string | null;
  setModalVar: (varName: string | null) => void;
  onSourceTypeChange: (varName: string, type: "manual" | "datalist") => void;
  onManualInputChange: (varName: string, value: string) => void;
  onDatalistSelect: (varName: string, datalistId: number) => void;
  onModalSelect: (varName: string, entry: string, datalistId: number) => void;
  onManualValueSelect: (varName: string, index: number) => void;
};

export default function VariableConfiguration({
  variables,
  variableValues,
  variableSelections,
  modalVar,
  setModalVar,
  onSourceTypeChange,
  onManualInputChange,
  onDatalistSelect,
  onModalSelect,
  onManualValueSelect,
}: VariableConfigurationProps) {
  const { datalists } = useDatalists();

  if (variables.length === 0) return null;

  return (
    <>
      {/* Dynamic variable inputs: source selection and values for each variable detected in the prompt */}
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
                  onChange={(e) =>
                    onSourceTypeChange(
                      v,
                      e.target.value as "manual" | "datalist"
                    )
                  }
                  className="border px-2 py-1 rounded"
                >
                  <option value="manual">Manual</option>
                  <option value="datalist">Datalist</option>
                </select>
                {sourceType === "manual" ? (
                  <input
                    type="text"
                    value={
                      variableValues &&
                      variableValues[v] &&
                      variableValues[v].values
                        ? variableValues[v].values!.join(",")
                        : ""
                    }
                    onChange={(e) => onManualInputChange(v, e.target.value)}
                    className="border px-2 py-1 rounded w-2/3"
                    placeholder={`Values for ${v} (comma separated)`}
                  />
                ) : (
                  <>
                    <select
                      value={datalistId ?? ""}
                      onChange={(e) =>
                        onDatalistSelect(v, Number(e.target.value))
                      }
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
                          variableSelections ? variableSelections[v] : undefined
                        }
                        onSelect={(entry, idx) =>
                          onModalSelect(v, entry, datalistId)
                        }
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dropdowns for selecting which value to inject for each variable, and select value modal for datalist */}
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
              variableValues[v].values &&
              variableValues[v].values![selectedIdx];
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
                    {selectedValue ? (
                      <span className="ml-2 text-green-700">
                        Selected: {selectedValue}
                      </span>
                    ) : (
                      <span className="ml-2 text-gray-500 text-sm">
                        No value selected
                      </span>
                    )}
                    {modalVar === v && datalistId && (
                      <DatalistSelectModal
                        datalistId={datalistId}
                        open={modalVar === v}
                        onClose={() => setModalVar(null)}
                        selectedIndex={selectedIdx}
                        onSelect={(entry, idx) =>
                          onModalSelect(v, entry, datalistId)
                        }
                      />
                    )}
                  </>
                ) : (
                  <select
                    value={selectedIdx}
                    onChange={(e) =>
                      onManualValueSelect(v, Number(e.target.value))
                    }
                    className="border px-2 py-1 rounded w-2/3"
                  >
                    {(variableValues &&
                    variableValues[v] &&
                    variableValues[v].values
                      ? variableValues[v].values!
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
    </>
  );
}
