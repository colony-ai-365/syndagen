export async function POST(req: Request) {
  try {
    const { route, body, method, field } = await req.json();
    const apiUrl = route.startsWith("http")
      ? route
      : `https://${route.replace(/^\//, "")}`;
    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: { "Content-Type": "application/json" },
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
      const keys = field.split(".");
      for (const key of keys) {
        console.log(key, responseData, responseData[key]);
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
