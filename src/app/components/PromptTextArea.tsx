// PromptTextArea.tsx
// Textarea component with syntax highlighting for variables
import { useRef } from "react";

type PromptTextAreaProps = {
  keyName: string;
  value: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
};

export default function PromptTextArea({
  keyName,
  value,
  onKeyChange,
  onValueChange,
}: PromptTextAreaProps) {
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
  );
}
