import crypto from 'crypto';
import { getDb, ensureSchema } from './lib/db.js';
import { signSession, setSessionCookie } from './lib/auth.js';

export const config = { runtime: 'nodejs' };

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + '::lp').digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = getDb();
    await ensureSchema(db);
    const { action } = req.query;
    const body = req.body || {};

    if (action === 'register') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const name = (body.name || email.split('@')[0]).trim();
      if (!email || !password) return res.status(400).json({ error: 'Email & password wajib' });
      const exists = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
      if (exists.rows.length) return res.status(409).json({ error: 'Email sudah terdaftar' });
      await db.execute({
        sql: 'INSERT INTO users (email, name, provider, password, role) VALUES (?, ?, ?, ?, ?)',
        args: [email, name, 'email', hashPassword(password), 'user']
      });
      const u = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      const row = u.rows[0];
      const token = signSession({ id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture });
      setSessionCookie(res, token);
      return res.status(200).json({ user: { id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture } });
    }

    if (action === 'login') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const u = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      if (!u.rows.length) return res.status(401).json({ error: 'Email tidak ditemukan' });
      const row = u.rows[0];
      if (row.provider === 'google' || !row.password) return res.status(401).json({ error: 'Gunakan login Google untuk akun ini' });
      if (row.password !== hashPassword(password)) return res.status(401).json({ error: 'Password salah' });
      const token = signSession({ id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture });
      setSessionCookie(res, token);
      return res.status(200).json({ user: { id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture } });
    }

    if (action === 'me') {
      const cookies = req.headers.cookie || '';
      const m = cookies.match(/lp_session=([^;]+)/);
      if (!m) return res.status(401).json({ error: 'not logged in' });
      const { verifySession } = await import('./lib/auth.js');
      const sess = verifySession(m[1]);
      if (!sess) return res.status(401).json({ error: 'invalid session' });
      const u = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [sess.id] });
      if (!u.rows.length) return res.status(401).json({ error: 'no user' });
      const row = u.rows[0];
      return res.status(200).json({ user: { id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture } });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
