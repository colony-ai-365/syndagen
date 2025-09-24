export async function POST(req: Request) {
  try {
    const { route, body, method, field, schema, headers } = await req.json();
    const apiUrl = route.startsWith("http")
      ? route
      : `https://${route.replace(/^\//, "")}`;
    // Merge custom headers with default
    const mergedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers || {}),
    };
    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: mergedHeaders,
    };
    if (method && method !== "GET" && body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }
    const res = await fetch(apiUrl, fetchOptions);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    let responseData = json;
    console.log(json);
    if (field && typeof json === "object" && json !== null) {
      // Split by dot, but handle array indices like key2[2]
      const pathRegex = /([\w-]+)(\[(\d+)\])?/g;
      const keys = field.split(".");
      for (const rawKey of keys) {
        const match = Array.from(
          rawKey.matchAll(pathRegex)
        ) as RegExpMatchArray[];
        for (const m of match) {
          const key = m[1];
          if (
            responseData &&
            typeof responseData === "object" &&
            key in responseData
          ) {
            responseData = responseData[key];
          } else {
            responseData = undefined;
            break;
          }
          // If array index present, traverse array
          if (m[3] !== undefined && Array.isArray(responseData)) {
            const idx = Number(m[3]);
            if (responseData.length > idx) {
              responseData = responseData[idx];
            } else {
              responseData = undefined;
              break;
            }
          }
        }
        if (responseData === undefined) break;
      }
      // If the field value is a JSON string, parse it
      if (typeof responseData === "string") {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          return new Response(
            JSON.stringify({ error: "Field value is not valid JSON." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      // Schema validation
      if (schema && Array.isArray(schema)) {
        if (typeof responseData !== "object" || responseData === null) {
          return new Response(
            JSON.stringify({
              error: "Response is not an object for schema validation.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        for (const fieldName of schema) {
          if (
            !(fieldName in responseData) ||
            typeof responseData[fieldName] !== "string"
          ) {
            return new Response(
              JSON.stringify({
                error: `Schema validation failed: missing or non-string field '${fieldName}'.`,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }
    return new Response(JSON.stringify({ data: responseData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log(err);
    return new Response(
      JSON.stringify({ error: "Failed to call API", details: String(err) }),
      { status: 500 }
    );
  }
}
