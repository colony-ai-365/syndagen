import { countGeneratedEntries, getGeneratorById } from "@/db/generators";

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const generator = getGeneratorById(Number(id));
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const count = countGeneratedEntries(Number(id));
  return new Response(JSON.stringify({ count }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
