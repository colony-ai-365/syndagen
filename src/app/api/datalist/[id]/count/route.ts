import { CountListEntries } from "@/db/dataList";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return context.params.then(({ id }) => {
    if (!id || isNaN(Number(id))) {
      return new Response(JSON.stringify({ error: "Invalid datalist id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(CountListEntries(Number(id)));

    try {
      const count = CountListEntries(Number(id));
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: err.message || "Failed to fetch datalist count.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  });
}
