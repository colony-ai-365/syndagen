import {
  getLatestGeneratedEntry,
  countGeneratedEntries,
  getGeneratorById,
} from "@/db/generators";

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const total = countGeneratedEntries(Number(id));
  const entry = getLatestGeneratedEntry(Number(id));
  if (!entry) {
    return new Response(JSON.stringify({ entry: null, index: -1, total }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ entry, index: total - 1, total }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
