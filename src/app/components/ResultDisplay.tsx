// ResultDisplay.tsx
// Component for displaying API response results or error messages in a formatted way.
type ResultDisplayProps = {
  result: any;
  error: string;
};

export default function ResultDisplay({ result, error }: ResultDisplayProps) {
  return (
    <>
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <pre className="mt-4 p-4 border rounded bg-gray-50 w-full max-w-full overflow-auto text-sm">
          {typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </>
  );
}
