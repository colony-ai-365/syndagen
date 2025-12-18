import { getNthDatalistEntry } from "@/db/dataList";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid datalist id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const value = getNthDatalistEntry(Number(id), 1);
    return new Response(JSON.stringify({ value }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to fetch first entry." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
