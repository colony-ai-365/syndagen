import { getDatalistEntriesPaginated, deleteDatalist } from "@/db/dataList";

export async function GET(req: Request) {
  // Get datalist entries by ID from query param, with pagination
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 50;
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid datalist id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { entries, total } = getDatalistEntriesPaginated(
      Number(id),
      page,
      limit
    );
    return new Response(JSON.stringify({ entries, total, page, limit }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to fetch datalist entries.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(req: Request) {
  // Get datalist id from URL
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid datalist id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    deleteDatalist(Number(id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to delete datalist." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
