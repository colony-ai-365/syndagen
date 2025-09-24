type SchemaFieldProps = {
  value: string;
  onChange: (val: string) => void;
};

export default function SchemaField({ value, onChange }: SchemaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Expected Schema (comma separated):</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. name,age,date"
      />
    </div>
  );
}
