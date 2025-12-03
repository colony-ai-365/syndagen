// PromptField.tsx
// Component for editing the prompt and managing dynamic variables. Uses usePromptVariables hook for variable detection.
import { usePromptVariables } from "../hooks/usePromptVariables";
import { useVariableManagement } from "../hooks/useVariableManagement";
import { VariableValues } from "../utils/formHelpers";
import PromptTextArea from "./PromptTextArea";
import VariableConfiguration from "./VariableConfiguration";

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

  // Use custom hook for variable management
  const {
    modalVar,
    setModalVar,
    handleSourceTypeChange,
    handleManualInputChange,
    handleDatalistSelect,
    handleModalSelect,
    handleManualValueSelect,
  } = useVariableManagement({
    variables,
    variableValues,
    setVariableValues,
    variableSelections,
    setVariableSelections,
  });

  return (
    <div className="flex flex-col gap-2 mb-4 p-4 border rounded bg-gray-50">
      <label className="font-bold text-lg mb-2">Prompt</label>
      <PromptTextArea
        keyName={keyName}
        value={value}
        onKeyChange={onKeyChange}
        onValueChange={onValueChange}
      />
      <VariableConfiguration
        variables={variables}
        variableValues={variableValues}
        variableSelections={variableSelections}
        modalVar={modalVar}
        setModalVar={setModalVar}
        onSourceTypeChange={handleSourceTypeChange}
        onManualInputChange={handleManualInputChange}
        onDatalistSelect={handleDatalistSelect}
        onModalSelect={handleModalSelect}
        onManualValueSelect={handleManualValueSelect}
      />
    </div>
  );
}
