import {
  createDatalist,
  addEntriesToDatalist,
  getAllDatalists,
} from "@/db/dataList";

export async function GET() {
  // List all datalists
  const lists = getAllDatalists();
  return new Response(JSON.stringify(lists), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Create a new datalist
  const data = await req.json();
  if (!data.name || !Array.isArray(data.values)) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const datalistId = createDatalist(data.name);
    addEntriesToDatalist(datalistId, data.values);
    return new Response(JSON.stringify({ success: true, id: datalistId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to save datalist." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
