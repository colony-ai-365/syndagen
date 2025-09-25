// route.ts
// API route for testing external APIs, extracting fields, and validating schema

/**
 * Extracts a nested field from an object using dot notation and array indices.
 */
function extractField(obj: any, field: string): any {
  if (!field || typeof obj !== "object" || obj === null) return obj;
  const pathRegex = /([\w-]+)(\[(\d+)\])?/g;
  const keys = field.split(".");
  let data = obj;
  for (const rawKey of keys) {
    const matches = Array.from(rawKey.matchAll(pathRegex));
    for (const m of matches) {
      const key = m[1];
      if (data && typeof data === "object" && key in data) {
        data = data[key];
      } else {
        return undefined;
      }
      // Handle array indices like key[2]
      if (m[3] !== undefined && Array.isArray(data)) {
        const idx = Number(m[3]);
        if (data.length > idx) {
          data = data[idx];
        } else {
          return undefined;
        }
      }
    }
    if (data === undefined) break;
  }
  return data;
}

/**
 * Validates that all fields in schema exist and are strings in the response object.
 */
function validateSchema(obj: any, schema: string[]): string | null {
  if (typeof obj !== "object" || obj === null) {
    return "Response is not an object for schema validation.";
  }
  for (const fieldName of schema) {
    if (!(fieldName in obj) || typeof obj[fieldName] !== "string") {
      return `Schema validation failed: missing or non-string field '${fieldName}'.`;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { route, body, method, field, schema, headers } = await req.json();

    // Build the API URL - add https:// prefix if not already present
    const apiUrl = route.startsWith("http")
      ? route
      : `https://${route.replace(/^\//, "")}`;

    // Merge custom headers with default Content-Type
    const mergedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers || {}),
    };

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: mergedHeaders,
    };

    // Add body for non-GET requests
    if (method && method !== "GET" && body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Make the API request
    const res = await fetch(apiUrl, fetchOptions);
    const text = await res.text();

    // Parse response as JSON, fallback to raw text
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    let responseData = json;

    // Extract specific field if requested
    if (field && typeof json === "object" && json !== null) {
      responseData = extractField(json, field);

      // If the extracted field is a JSON string, try to parse it
      if (typeof responseData === "string") {
        const match = responseData.match(/({[\s\S]*})/);
        if (match && match[1]) {
          try {
            responseData = JSON.parse(match[1]);
          } catch {
            return new Response(
              JSON.stringify({
                error: "Matched field value is not valid JSON.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        } else {
          try {
            responseData = JSON.parse(responseData);
          } catch {
            return new Response(
              JSON.stringify({ error: "Field value is not valid JSON." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }

      // Validate against expected schema if provided
      if (schema && Array.isArray(schema)) {
        const schemaError = validateSchema(responseData, schema);
        if (schemaError) {
          return new Response(JSON.stringify({ error: schemaError }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({ data: responseData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to call API", details: String(err) }),
      { status: 500 }
    );
  }
}
