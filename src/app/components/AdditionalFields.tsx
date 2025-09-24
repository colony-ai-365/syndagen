type Field = { key: string; value: string; type?: string };

interface AdditionalFieldsProps {
  fields: Field[];
  onFieldChange: (
    idx: number,
    fieldType: "key" | "value" | "type",
    val: string
  ) => void;
  onRemoveField: (idx: number) => void;
  onAddField: () => void;
  hideType?: boolean;
}

export default function AdditionalFields({
  fields,
  onFieldChange,
  onRemoveField,
  onAddField,
  hideType,
}: AdditionalFieldsProps) {
  return (
    <div className="flex flex-col gap-2">
      {fields.map((f, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            value={f.key}
            onChange={(e) => onFieldChange(idx, "key", e.target.value)}
            className="border px-2 py-1 rounded font-mono w-1/4"
            placeholder="key"
          />
          <input
            type="text"
            value={f.value}
            onChange={(e) => onFieldChange(idx, "value", e.target.value)}
            className="border px-2 py-1 rounded font-mono w-1/3"
            placeholder="value"
          />
          {!hideType && (
            <select
              value={f.type}
              onChange={(e) => onFieldChange(idx, "type", e.target.value)}
              className="border px-2 py-1 rounded font-mono"
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
          )}
          <button
            type="button"
            className="px-2 py-1 bg-red-500 text-white rounded"
            onClick={() => onRemoveField(idx)}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="px-2 py-1 bg-green-600 text-white rounded mt-2"
        onClick={onAddField}
      >
        Add Field
      </button>
    </div>
  );
}
