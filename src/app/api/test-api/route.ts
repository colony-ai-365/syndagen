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

function debugPreview(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return {
      type: "string",
      length: value.length,
      trimmedStart: trimmed.slice(0, 120),
      trimmedEnd: trimmed.slice(Math.max(0, trimmed.length - 80)),
      startsWith: trimmed.slice(0, 1),
      endsWith: trimmed.slice(-1),
    };
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      return { type: "array", length: value.length };
    }
    const keys = Object.keys(value as Record<string, unknown>);
    return {
      type: "object",
      keyCount: keys.length,
      keysSample: keys.slice(0, 12),
    };
  }
  return { type: typeof value, value };
}

/**
 * Validates that all fields in schema exist and are strings in the response object.
 */
function validateSchema(obj: any, schema: string[]): string | null {
  if (typeof obj !== "object" || obj === null) {
    console.log("[test-api] schema: non-object", debugPreview(obj));
    return "Response is not an object for schema validation.";
  }
  for (const fieldName of schema) {
    if (!(fieldName in obj) || typeof obj[fieldName] !== "string") {
      return `Schema validation failed: missing or non-string field '${fieldName}'.`;
    }
  }
  return null;
}

function fixJsonNewlines(s: string) {
  return s.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) =>
    m.replace(/\n/g, "\\n")
  );
}

function tryParseJsonString(value: string): unknown | null {
  const candidate = value.trim();
  try {
    const parsed = JSON.parse(fixJsonNewlines(candidate));
    console.log("[test-api] parse ok", {
      input: debugPreview(candidate),
      output: debugPreview(parsed),
    });
    return parsed;
  } catch (err) {
    console.log("[test-api] parse fail", {
      input: debugPreview(candidate),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function extractFirstBalancedJsonObject(input: string): string | null {
  const s = input.trim();
  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;

    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }

  return null;
}

function salvageTopLevelStringFields(
  raw: string,
  keys: string[]
): Record<string, string> | null {
  const out: Record<string, string> = {};
  let foundAny = false;

  // Best-effort extractor for patterns like: "key": "..." (value may contain escaped quotes)
  for (const key of keys) {
    const re = new RegExp(
      `"${key.replace(
        /[.*+?^${}()|[\\]\\]/g,
        "\\$&"
      )}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`,
      "m"
    );
    const m = raw.match(re);
    if (m?.[1] !== undefined) {
      foundAny = true;
      try {
        // decode JSON string escapes by parsing as a JSON string
        out[key] = JSON.parse(`"${m[1]}"`);
      } catch {
        out[key] = m[1];
      }
    }
  }

  return foundAny ? out : null;
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
      json = JSON.parse(fixJsonNewlines(text));
      console.log("[test-api] outer parse ok", debugPreview(json));
    } catch (err) {
      json = { raw: "" };
      console.log("[test-api] outer parse fail", {
        error: err instanceof Error ? err.message : String(err),
        text: debugPreview(text),
      });
    }

    let responseData = json;

    // Extract specific field if requested
    if (field && typeof json === "object" && json !== null) {
      responseData = extractField(json, field);
      console.log("[test-api] extracted", {
        field,
        extracted: debugPreview(responseData),
      });

      // If the extracted field is a JSON string, try to parse it.
      // Otherwise, treat it as plain text (e.g. LLM responses).
      if (typeof responseData === "string") {
        console.log("[test-api] extracted is string; parse attempts start", {
          field,
          extracted: debugPreview(responseData),
        });
        const trimmed = responseData.trim();

        // 1) If it's already a full JSON object/array string (optionally wrapped in quotes), parse it.
        let directParsed = tryParseJsonString(trimmed);
        if (directParsed === null && trimmed.startsWith("{")) {
          const balanced = extractFirstBalancedJsonObject(trimmed);
          if (balanced) {
            console.log(
              "[test-api] balanced object candidate",
              debugPreview(balanced)
            );
            directParsed = tryParseJsonString(balanced);
          } else {
            console.log(
              "[test-api] balanced object candidate not found",
              debugPreview(trimmed)
            );
          }
        }
        if (directParsed !== null) {
          responseData = directParsed;
        } else {
          // 2) If it contains an embedded JSON object (common with LLMs), parse the first one.
          const match = responseData.match(/({[\s\S]*})/);
          if (match?.[1]) {
            console.log(
              "[test-api] embedded candidate",
              debugPreview(match[1])
            );
            const embeddedParsed = tryParseJsonString(match[1]);
            if (embeddedParsed !== null) {
              responseData = embeddedParsed;
            }
          }
        }
      }

      console.log("[test-api] before schema", {
        field,
        responseData: debugPreview(responseData),
        schema: Array.isArray(schema) ? schema : undefined,
      });
      // Validate against expected schema if provided
      if (schema && Array.isArray(schema)) {
        // Tolerant mode: if we still have a string but schema expects top-level fields,
        // attempt to salvage required keys into an object.
        if (typeof responseData === "string") {
          const salvaged = salvageTopLevelStringFields(responseData, schema);
          if (salvaged) {
            console.log("[test-api] salvaged fields for schema", {
              field,
              salvaged: debugPreview(salvaged),
            });
            responseData = salvaged;
          }
        }

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
