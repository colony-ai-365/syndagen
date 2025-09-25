// API route for getting, updating, and deleting a single request config
import {
  getRequestConfigById,
  updateRequestConfig,
  deleteRequestConfig,
} from "@/db/requestConfig";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const config = getRequestConfigById(Number(id));
  if (!config) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const data = await req.json();
  updateRequestConfig(Number(id), data);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  deleteRequestConfig(Number(id));
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
