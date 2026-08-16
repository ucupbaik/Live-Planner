import { getDb, ensureSchema } from './lib/db.js';
import { getUser } from './lib/auth.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = getDb();
    await ensureSchema(db);
    const user = getUser(req);
    const { id } = req.query;

    // GET /api/templates  (list)
    if (req.method === 'GET' && !id) {
      const scope = req.query.scope || 'mine';
      let rows;
      if (scope === 'public') {
        rows = await db.execute(`SELECT t.*, u.name as owner_name FROM templates t LEFT JOIN users u ON u.id=t.owner_id
          WHERE t.is_public=1 AND t.hidden=0 ORDER BY t.updated_at DESC`);
      } else if (scope === 'templates') {
        rows = await db.execute(`SELECT t.*, u.name as owner_name FROM templates t LEFT JOIN users u ON u.id=t.owner_id
          WHERE t.is_template=1 AND t.hidden=0 ORDER BY t.updated_at DESC`);
      } else if (user && user.role === 'admin') {
        rows = await db.execute(`SELECT t.*, u.name as owner_name FROM templates t LEFT JOIN users u ON u.id=t.owner_id
          ORDER BY t.updated_at DESC`);
      } else if (user) {
        rows = await db.execute({ sql: `SELECT t.*, u.name as owner_name FROM templates t LEFT JOIN users u ON u.id=t.owner_id
          WHERE t.owner_id=? OR (t.is_public=1 AND t.hidden=0) ORDER BY t.updated_at DESC`, args: [user.id] });
      } else {
        rows = await db.execute(`SELECT t.*, u.name as owner_name FROM templates t LEFT JOIN users u ON u.id=t.owner_id
          WHERE t.is_public=1 AND t.hidden=0 ORDER BY t.updated_at DESC`);
      }
      const items = rows.rows.map(r => ({
        id: Number(r.id), title: r.title, module: r.module,
        is_public: !!r.is_public, is_template: !!r.is_template, hidden: !!r.hidden,
        owner_id: r.owner_id ? Number(r.owner_id) : null, owner_name: r.owner_name,
        created_at: r.created_at, updated_at: r.updated_at,
        data: (typeof r.data === 'string') ? JSON.parse(r.data) : r.data
      }));
      return res.status(200).json({ items });
    }

    // GET /api/templates/:id  (single, with comments)
    if (req.method === 'GET' && id) {
      const t = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [id] });
      if (!t.rows.length) return res.status(404).json({ error: 'not found' });
      const row = t.rows[0];
      const c = await db.execute({ sql: `SELECT c.*, u.name as user_name FROM comments c LEFT JOIN users u ON u.id=c.user_id WHERE c.template_id=? ORDER BY c.created_at ASC`, args: [id] });
      const comments = c.rows.map(r => ({ id: Number(r.id), text: r.text, user_name: r.user_name, created_at: r.created_at }));
      return res.status(200).json({
        id: Number(row.id), title: row.title, module: row.module,
        is_public: !!row.is_public, is_template: !!row.is_template, hidden: !!row.hidden,
        owner_id: row.owner_id ? Number(row.owner_id) : null,
        data: (typeof row.data === 'string') ? JSON.parse(row.data) : row.data,
        comments
      });
    }

    // Auth required for mutations
    if (!user) return res.status(401).json({ error: 'login required' });

    // POST /api/templates  (create)
    if (req.method === 'POST') {
      const { title, module, data, is_public, is_template } = req.body || {};
      if (!title || !module) return res.status(400).json({ error: 'title & module wajib' });
      const r = await db.execute({
        sql: 'INSERT INTO templates (owner_id, title, module, data, is_public, is_template) VALUES (?, ?, ?, ?, ?, ?)',
        args: [user.id, title, module, JSON.stringify(data || {}), is_public ? 1 : 0, is_template ? 1 : 0]
      });
      return res.status(200).json({ id: Number(r.lastInsertRowid), ok: true });
    }

    // PUT /api/templates/:id  (update / admin controls)
    if (req.method === 'PUT' && id) {
      const t = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [id] });
      if (!t.rows.length) return res.status(404).json({ error: 'not found' });
      const row = t.rows[0];
      const isOwner = Number(row.owner_id) === user.id;
      const isAdmin = user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });
      const b = req.body || {};
      const title = b.title !== undefined ? b.title : row.title;
      const data = b.data !== undefined ? JSON.stringify(b.data) : row.data;
      const isPublic = b.is_public !== undefined ? (b.is_public ? 1 : 0) : row.is_public;
      const isTpl = b.is_template !== undefined ? (b.is_template ? 1 : 0) : row.is_template;
      const hidden = b.hidden !== undefined ? (b.hidden ? 1 : 0) : row.hidden;
      await db.execute({
        sql: 'UPDATE templates SET title=?, data=?, is_public=?, is_template=?, hidden=?, updated_at=datetime(\'now\') WHERE id=?',
        args: [title, data, isPublic, isTpl, hidden, id]
      });
      return res.status(200).json({ ok: true });
    }

    // DELETE /api/templates/:id  (owner or admin)
    if (req.method === 'DELETE' && id) {
      const t = await db.execute({ sql: 'SELECT * FROM templates WHERE id = ?', args: [id] });
      if (!t.rows.length) return res.status(404).json({ error: 'not found' });
      const row = t.rows[0];
      if (Number(row.owner_id) !== user.id && user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      await db.execute({ sql: 'DELETE FROM comments WHERE template_id = ?', args: [id] });
      await db.execute({ sql: 'DELETE FROM templates WHERE id = ?', args: [id] });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
