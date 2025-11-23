// ActionButtonsSection.tsx
// Contains the "Send Request" and "Save Changes" buttons, and status messages.

type ActionButtonsSectionProps = {
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  saveLoading: boolean;
  handleSaveChanges: () => void;
  initialConfig?: { id?: string | number };
  saveMessage: string;
};

export default function ActionButtonsSection({
  loading,
  handleSubmit,
  saveLoading,
  handleSaveChanges,
  initialConfig,
  saveMessage,
}: ActionButtonsSectionProps) {
  return (
    <>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Testing..." : "Send Request"}
      </button>
      {initialConfig?.id && (
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mt-2"
          onClick={handleSaveChanges}
          disabled={saveLoading}
        >
          {saveLoading ? "Saving..." : "Save Changes"}
        </button>
      )}
      {saveMessage && <div className="text-green-700 mt-2">{saveMessage}</div>}
    </>
  );
}
