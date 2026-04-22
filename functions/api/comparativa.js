export async function onRequest(context) {
  const { env } = context;
  
  try {
    // Get last 365 days of percentage data for ALL reservoirs
    // We'll group by reservoir name/id
    const { results } = await env.DB.prepare(`
      SELECT e.nombre, m.fecha, m.pct_volumen 
      FROM mediciones m
      JOIN embalses e ON m.embalse_id = e.id
      WHERE m.fecha >= date('now', '-365 days')
      ORDER BY m.fecha ASC
    `).all();
    
    // Structure: { "Embalse A": [{fecha, pct}, ...], "Embalse B": [...] }
    const grouped = results.reduce((acc, curr) => {
      if (!acc[curr.nombre]) acc[curr.nombre] = [];
      acc[curr.nombre].push({ fecha: curr.fecha, pct: curr.pct_volumen });
      return acc;
    }, {});
    
    return new Response(JSON.stringify(grouped), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
