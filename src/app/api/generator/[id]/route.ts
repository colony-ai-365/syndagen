import {
  getGeneratorById,
  updateGenerator,
  deleteGenerator,
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
  return new Response(JSON.stringify({ generator }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const existing = getGeneratorById(Number(id));
  if (!existing) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
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
  const updates: any = {};

  // Enforce immutability after start:
  // - while draft: allow name/config_id/gap/total_combinations and status draft->started
  // - while started: allow only progress fields and status started->terminated
  if (existing.status === "draft") {
    if ("gap" in body) updates.gap = Number(body.gap);
    if ("name" in body) updates.name = body.name;
    if ("config_id" in body) updates.config_id = Number(body.config_id);
    if ("total_combinations" in body)
      updates.total_combinations = Number(body.total_combinations);

    if ("status" in body) {
      const next = body.status;
      if (next !== "started" && next !== "draft") {
        return new Response(
          JSON.stringify({ error: "Invalid status transition" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      updates.status = next;
    }
  } else if (existing.status === "started") {
    if ("completed_combinations" in body)
      updates.completed_combinations = Number(body.completed_combinations);
    if ("status" in body) {
      const next = body.status;
      if (next !== "terminated" && next !== "started") {
        return new Response(
          JSON.stringify({ error: "Invalid status transition" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      updates.status = next;
    }

    // explicitly forbid changes to immutable fields
    if (
      "gap" in body ||
      "name" in body ||
      "config_id" in body ||
      "total_combinations" in body
    ) {
      return new Response(
        JSON.stringify({ error: "Generator cannot be modified after start" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else {
    return new Response(JSON.stringify({ error: "Generator is terminated" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (Object.keys(updates).length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid fields to update" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  try {
    updateGenerator(Number(id), updates);
    const updated = getGeneratorById(Number(id));
    return new Response(JSON.stringify({ success: true, generator: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  deleteGenerator(Number(id));
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
