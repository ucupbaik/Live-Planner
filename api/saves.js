import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;

function db() {
  if (!url || !token) throw new Error('TURSO env missing');
  return createClient({ url, authToken: token });
}

export const config = { runtime: 'nodejs18.x' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const client = db();
    if (req.method === 'GET') {
      const rs = await client.execute(
        "SELECT id, title, created_at, json_array_length(data->'$.nodes') AS cnt FROM saves ORDER BY created_at DESC"
      );
      const items = rs.rows.map(r => ({
        id: String(r.id),
        title: r.title,
        created_at: r.created_at,
        count: Number(r.cnt) || 0
      }));
      return res.status(200).json({ items });
    }
    if (req.method === 'POST') {
      const { title, data } = req.body || {};
      if (!title || !data) return res.status(400).json({ error: 'title & data required' });
      await client.execute(
        "CREATE TABLE IF NOT EXISTS saves (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, data TEXT, created_at TEXT DEFAULT (datetime('now')))"
      );
      const rs = await client.execute({
        sql: 'INSERT INTO saves (title, data) VALUES (?, ?)',
        args: [title, JSON.stringify(data)]
      });
      return res.status(200).json({ id: Number(rs.lastInsertRowid), ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
