// Vercel serverless function: serves equipment data from Turso.
// The TURSO_TOKEN is read from environment (server-side only) and never sent to the client.
import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;

export default async function handler(req, res) {
  if (!url || !token) {
    return res.status(500).json({ error: 'Turso not configured' });
  }
  const db = createClient({ url, authToken: token });

  try {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const cat = (searchParams.get('cat') || '').trim();
    const brand = (searchParams.get('brand') || '').trim();

    let sql = 'SELECT * FROM equipment';
    const where = [];
    const args = [];
    if (q) { where.push('(LOWER(name) LIKE ? OR LOWER(brand) LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
    if (cat) { where.push('category = ?'); args.push(cat); }
    if (brand) { where.push('brand = ?'); args.push(brand); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY no ASC';

    const result = await db.execute({ sql, args });
    const items = result.rows.map((r) => ({
      id: r.id,
      no: r.no,
      name: r.name,
      brand: r.brand,
      cat: r.category,
      img: r.img,
      emoji: r.emoji,
      hasSettings: !!r.has_settings,
      inputs: JSON.parse(r.inputs || '[]'),
      outputs: JSON.parse(r.outputs || '[]'),
      func: r.func,
      ports_raw: r.ports_raw,
    }));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
