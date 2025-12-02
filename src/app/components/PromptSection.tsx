// PromptSection.tsx
// Handles the prompt field and variable management (uses PromptField)
import PromptField from "./PromptField";

import { Field } from "../hooks/useFields";
import { VariableValues } from "../utils/formHelpers";

type PromptSectionProps = {
  fields: Field[];
  handleFieldChange: (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => void;
  variableSelections: Record<string, number>;
  setVariableSelections: (sel: Record<string, number>) => void;
  variableValues: VariableValues;
  setVariableValues: (vals: VariableValues) => void;
};

export default function PromptSection({
  fields,
  handleFieldChange,
  variableSelections,
  setVariableSelections,
  variableValues,
  setVariableValues,
}: PromptSectionProps) {
  return (
    <PromptField
      keyName={fields[0].key}
      value={fields[0].value}
      onKeyChange={(val) => handleFieldChange(0, "key", val)}
      onValueChange={(val) => handleFieldChange(0, "value", val)}
      variableSelections={variableSelections}
      setVariableSelections={setVariableSelections}
      variableValues={variableValues}
      setVariableValues={setVariableValues}
    />
  );
}
