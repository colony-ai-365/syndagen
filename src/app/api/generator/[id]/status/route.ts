// API routes for updating generator and changing status
import { getGeneratorById, updateGenerator, Generator } from "@/db/generators";

// Update generator fields (only if status is draft)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  if (generator.status !== "draft") {
    return new Response(
      JSON.stringify({ error: "Can only update draft generators" }),
      { status: 400 }
    );
  }
  const data = await req.json();
  updateGenerator(Number(id), data);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// Change status to started (only from draft)
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  if (generator.status !== "draft") {
    return new Response(
      JSON.stringify({ error: "Can only start draft generators" }),
      { status: 400 }
    );
  }
  updateGenerator(Number(id), { status: "started" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// Change status to terminated (from started)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  if (generator.status !== "started") {
    return new Response(
      JSON.stringify({ error: "Can only terminate started generators" }),
      { status: 400 }
    );
  }
  updateGenerator(Number(id), { status: "terminated" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
