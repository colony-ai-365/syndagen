// RequestMetaSection.tsx
// Handles request name, method, route, field, and schema input.
import SchemaField from "./SchemaField";

type RequestMetaSectionProps = {
  requestName: string;
  method: string;
  setMethod: (val: string) => void;
  route: string;
  setRoute: (val: string) => void;
  field: string;
  setField: (val: string) => void;
  schemaInput: string;
  setSchemaInput: (val: string) => void;
};

export default function RequestMetaSection({
  requestName,
  method,
  setMethod,
  route,
  setRoute,
  field,
  setField,
  schemaInput,
  setSchemaInput,
}: RequestMetaSectionProps) {
  return (
    <>
      <label className="font-medium">Request Name:</label>
      <input
        type="text"
        value={requestName}
        onChange={() => {}}
        className="border px-3 py-2 rounded bg-gray-100 text-gray-700"
        placeholder="Request name"
        readOnly
      />
      <label className="font-medium">Request Method:</label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="border px-3 py-2 rounded bg-gray-200 text-gray-700"
      >
        <option value="GET" className="bg-gray-200 text-gray-700">
          GET
        </option>
        <option value="POST" className="bg-gray-200 text-gray-700">
          POST
        </option>
        <option value="PUT" className="bg-gray-200 text-gray-700">
          PUT
        </option>
        <option value="DELETE" className="bg-gray-200 text-gray-700">
          DELETE
        </option>
        <option value="PATCH" className="bg-gray-200 text-gray-700">
          PATCH
        </option>
      </select>
      <label className="font-medium">API Route (absolute or relative):</label>
      <input
        type="text"
        value={route}
        onChange={(e) => setRoute(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. https://jsonplaceholder.typicode.com/posts"
        required
      />
      <label className="font-medium">Field Name (optional):</label>
      <input
        type="text"
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="border px-3 py-2 rounded"
        placeholder="e.g. id"
      />
      <SchemaField value={schemaInput} onChange={setSchemaInput} />
    </>
  );
}
