import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;

function db() {
  if (!url || !token) throw new Error('TURSO env missing');
  return createClient({ url, authToken: token });
}

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const client = db();
    const rs = await client.execute({
      sql: 'SELECT id, title, data FROM saves WHERE id = ?',
      args: [id]
    });
    if (!rs.rows.length) return res.status(404).json({ error: 'not found' });
    const row = rs.rows[0];
    return res.status(200).json({ id: String(row.id), title: row.title, data: JSON.parse(row.data) });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
