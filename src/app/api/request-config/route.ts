// API route for listing and creating request configs
import {
  getAllRequestConfigs,
  createDraftRequestConfig,
} from "@/db/requestConfig";
//
export async function GET() {
  // List all request configs
  const configs = getAllRequestConfigs();
  return new Response(JSON.stringify(configs), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Create a new request config (draft or full)
  const data = await req.json();
  if (data.name && Object.keys(data).length === 1) {
    // Only name provided, create draft
    const id = createDraftRequestConfig(data.name);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
