import { useState, useEffect, useRef } from "react";

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
  // Detect dynamic variables in prompt
  const variableRegex = /{{\s*([\w.-]+)\s*}}/g;
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const found = Array.from(
      new Set([...value.matchAll(variableRegex)].map((m) => m[1]))
    );
    setVariables(found);

    // Remove values for variables no longer present
    setVariableValues((prev) => {
      const updated: Record<string, string> = {};
      for (const v of found) {
        updated[v] = prev[v] || "";
      }
      return updated;
    });
  }, [value]);

  // Highlight variables in preview
  const getHighlightedPrompt = () => {
    if (!value) return "";
    return value.replace(variableRegex, (match) => {
      return `<span style='color: orange; font-weight: bold;'>${match}</span>`;
    });
  };

  // Refs for scroll sync
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

      {/* Dynamic variable inputs */}
      {variables.length > 0 && (
        <div className="mt-2">
          <label className="font-semibold text-base mb-1 block">
            Dynamic Variables:
          </label>
          <div className="flex flex-col gap-2">
            {variables.map((v) => (
              <div key={v} className="flex gap-2 items-center">
                <span className="font-mono text-orange-600">{v}</span>
                <input
                  type="text"
                  value={variableValues[v] || ""}
                  onChange={(e) =>
                    setVariableValues((prev) => ({
                      ...prev,
                      [v]: e.target.value,
                    }))
                  }
                  className="border px-2 py-1 rounded w-2/3"
                  placeholder={`Value for ${v}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
