// BodyFieldsSection.tsx
// Manages additional body fields (uses AdditionalFields for fields after the prompt)
import AdditionalFields from "./AdditionalFields";

import { Field } from "../hooks/useFields";

type BodyFieldsSectionProps = {
  fields: Field[];
  handleFieldChange: (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => void;
  handleRemoveField: (idx: number) => void;
  handleAddField: () => void;
};

export default function BodyFieldsSection({
  fields,
  handleFieldChange,
  handleRemoveField,
  handleAddField,
}: BodyFieldsSectionProps) {
  return (
    <AdditionalFields
      fields={fields.slice(1)}
      onFieldChange={(idx, type, val) => handleFieldChange(idx + 1, type, val)}
      onRemoveField={(idx) => handleRemoveField(idx + 1)}
      onAddField={handleAddField}
    />
  );
}
