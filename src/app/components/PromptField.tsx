type PromptFieldProps = {
  keyName: string;
  value: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
};

export default function PromptField({
  keyName,
  value,
  onKeyChange,
  onValueChange,
}: PromptFieldProps) {
  return (
    <div className="flex flex-col gap-2 mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <label className="font-bold text-lg mb-2">Prompt</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={keyName}
          onChange={(e) => onKeyChange(e.target.value)}
          className="border px-2 py-1 rounded font-mono w-1/6"
          placeholder="key"
          disabled
        />
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="border px-3 py-2 rounded font-mono w-full min-h-[120px] resize-y text-base"
          placeholder="Enter your prompt here..."
        />
      </div>
    </div>
  );
}
