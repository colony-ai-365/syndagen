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
    const url = new URL(req.url);
    const nParam = url.searchParams.get("n");
    const n = nParam ? Number(nParam) : 1;
    if (!Number.isFinite(n) || n < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid 'n' query param" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const value = getNthDatalistEntry(Number(id), n);
    if (value === undefined) {
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ value }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : "Failed to fetch nth entry.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
