import { getDatalistEntries, deleteDatalist } from "@/db/dataList";

export async function GET(req: Request) {
  // Get datalist entries by ID from query param
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid datalist id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const entries = getDatalistEntries(Number(id));
    return new Response(JSON.stringify(entries), {
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
