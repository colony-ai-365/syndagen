// HeadersSection.tsx
// Manages custom headers (uses AdditionalFields)
import AdditionalFields from "./AdditionalFields";

import { Field } from "../hooks/useFields";

type HeadersSectionProps = {
  headers: Field[];
  handleHeaderChange: (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => void;
  handleRemoveHeader: (idx: number) => void;
  handleAddHeader: () => void;
};

export default function HeadersSection({
  headers,
  handleHeaderChange,
  handleRemoveHeader,
  handleAddHeader,
}: HeadersSectionProps) {
  return (
    <>
      <label className="font-medium">Custom Headers:</label>
      <AdditionalFields
        fields={headers}
        onFieldChange={handleHeaderChange}
        onRemoveField={handleRemoveHeader}
        onAddField={handleAddHeader}
        hideType={true}
      />
    </>
  );
}
