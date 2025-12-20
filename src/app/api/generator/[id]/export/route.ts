import { NextResponse } from "next/server";
import { getGeneratedEntries, getGeneratorById } from "@/db/generators";

function escapeCsv(value: string) {
  if (value == null) return "";
  const s = String(value);
  // escape double quotes
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing generator id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const gid = Number(id);
  if (!Number.isFinite(gid)) {
    return new Response(JSON.stringify({ error: "Invalid generator id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const generator = getGeneratorById(gid);
  if (!generator) {
    return new Response(JSON.stringify({ error: "Generator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const entries = getGeneratedEntries(gid);

  // Build header union from all inputs
  const allKeys = new Set<string>();
  for (const e of entries) {
    const inputs = (e as any).inputs || {};
    Object.keys(inputs).forEach((k) => allKeys.add(k));
  }
  const keys = Array.from(allKeys).sort();

  // Build CSV: columns: id, ...keys, output
  const header = ["id", ...keys, "output"].map(escapeCsv).join(",") + "\n";

  const rows = entries
    .map((e: any) => {
      const inputs = e.inputs || {};
      const cols = [
        String(e.id),
        ...keys.map((k) => escapeCsv(inputs[k] ?? "")),
        escapeCsv(
          typeof e.output === "string" ? e.output : JSON.stringify(e.output)
        ),
      ];
      return cols.join(",");
    })
    .join("\n");

  const csv = header + rows + (rows.length ? "\n" : "");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="generator-${gid}-entries.csv"`,
    },
  });
}
