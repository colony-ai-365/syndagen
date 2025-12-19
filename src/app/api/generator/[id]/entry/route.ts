import {
  createGeneratedEntry,
  countGeneratedEntries,
  getGeneratedEntryByIndex,
  getGeneratorById,
} from "@/db/generators";
// GET /api/generator/[id]/entry?n=5 returns the nth generated entry (0-based index)
export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const n = url.searchParams.get("n");
  if (!id || n === null) {
    return new Response(
      JSON.stringify({ error: "Missing generator id or n" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const idx = Number(n);
  if (isNaN(idx) || idx < 0) {
    return new Response(JSON.stringify({ error: "Invalid n" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const total = countGeneratedEntries(Number(id));
  const entry = getGeneratedEntryByIndex(Number(id), idx);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Entry not found", total }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ entry, index: idx, total }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing generator id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { inputs, output } = body || {};
  if (!inputs || typeof output === "undefined") {
    return new Response(JSON.stringify({ error: "Missing inputs or output" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const entryId = createGeneratedEntry({
      generator_id: Number(id),
      inputs,
      output: typeof output === "string" ? output : JSON.stringify(output),
    });
    return new Response(JSON.stringify({ success: true, id: entryId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
