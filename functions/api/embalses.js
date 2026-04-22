export async function onRequest(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, nombre FROM embalses ORDER BY nombre ASC"
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
