// route.ts
// Simple health check endpoint that returns server status and current timestamp.
export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", time: new Date().toISOString() }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
