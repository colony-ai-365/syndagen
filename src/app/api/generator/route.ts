// API route for listing and creating generators
import {
  getAllGenerators,
  createGenerator,
  deleteGenerator,
} from "@/db/generators";

export async function GET() {
  // List all generators
  const generators = getAllGenerators();
  return new Response(JSON.stringify(generators), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Create a new generator
  const data = await req.json();
  if (data.name && data.config_id) {
    const id = createGenerator({
      name: data.name,
      config_id: data.config_id,
      gap: data.gap || 0,
      total_combinations: data.total_combinations || 0,
      completed_combinations: 0,
      status: "draft",
    });
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
