// apiUtils.ts
// Utility functions for field extraction and schema validation in API responses

/**
 * Extracts a nested field from an object using dot notation and array indices.
 */
export function extractField(obj: any, field: string): any {
  // If no field or not an object, return undefined
  if (!field || typeof obj !== "object" || obj === null) return undefined;
  // Regex to match keys and array indices, e.g. key, key[2]
  const pathRegex = /([\w-]+)(\[(\d+)\])?/g;
  // Split field path by dot notation
  const keys = field.split(".");
  let data = obj;
  for (const rawKey of keys) {
    // For each segment, match keys and array indices
    const match = Array.from(rawKey.matchAll(pathRegex));
    for (const m of match) {
      const key = m[1];
      // Traverse object by key
      if (data && typeof data === "object" && key in data) {
        data = data[key];
      } else {
        return undefined;
      }
      // If array index present, traverse array
      if (m[3] !== undefined && Array.isArray(data)) {
        const idx = Number(m[3]);
        if (data.length > idx) {
          data = data[idx];
        } else {
          return undefined;
        }
      }
    }
  }
  // Return the extracted value
  return data;
}

/**
 * Validates that all fields in schema exist and are strings in the response object.
 */
export function validateSchema(obj: any, schema: string[]): string | null {
  // Ensure obj is a valid object
  if (typeof obj !== "object" || obj === null) {
    return "Response is not an object for schema validation.";
  }
  // Check each field in schema exists and is a string
  for (const fieldName of schema) {
    if (!(fieldName in obj) || typeof obj[fieldName] !== "string") {
      return `Schema validation failed: missing or non-string field '${fieldName}'.`;
    }
  }
  // Return null if validation passes
  return null;
}
