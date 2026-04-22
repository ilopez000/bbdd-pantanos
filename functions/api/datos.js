export async function onRequest(context) {
  const { env, request } = context;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const limit = searchParams.get("limit") || 365; // Default to last year

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing reservoir ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT fecha, nivel_absoluto, pct_volumen, volumen_hm3 FROM mediciones WHERE embalse_id = ? ORDER BY fecha DESC LIMIT ?"
    )
    .bind(id, limit)
    .all();
    
    // Reverse for chronological order in charts
    return new Response(JSON.stringify(results.reverse()), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
