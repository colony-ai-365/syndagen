import {
  countGeneratedEntries,
  getGeneratedEntryByIndex,
  getGeneratorById,
} from "@/db/generators";

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const nParam = url.searchParams.get("n");

  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (nParam === null) {
    return new Response(JSON.stringify({ error: "Missing n" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const idx = Number(nParam);
  if (!Number.isFinite(idx) || idx < 0) {
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
