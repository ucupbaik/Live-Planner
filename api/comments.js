import { getDb, ensureSchema } from './lib/db.js';
import { getUser } from './lib/auth.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = getDb();
    await ensureSchema(db);
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'login required' });
    const { id } = req.query; // template id

    if (req.method === 'POST') {
      const { text } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ error: 'komentar kosong' });
      const r = await db.execute({
        sql: 'INSERT INTO comments (template_id, user_id, text) VALUES (?, ?, ?)',
        args: [id, user.id, text.trim()]
      });
      return res.status(200).json({ id: Number(r.lastInsertRowid), ok: true });
    }
    if (req.method === 'DELETE') {
      const { cid } = req.query;
      const c = await db.execute({ sql: 'SELECT * FROM comments WHERE id = ?', args: [cid] });
      if (!c.rows.length) return res.status(404).json({ error: 'not found' });
      const row = c.rows[0];
      if (Number(row.user_id) !== user.id && user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      await db.execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [cid] });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
