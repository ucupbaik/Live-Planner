import crypto from 'crypto';
import { getDb, ensureSchema } from './lib/db.js';
import { signSession, setSessionCookie } from './lib/auth.js';

export const config = { runtime: 'nodejs' };

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT = process.env.GOOGLE_REDIRECT || 'https://event-broadcast-planner.vercel.app/api/auth/google';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const db = getDb();
    await ensureSchema(db);
    const { action } = req.query;

    if (action === 'begin' || !action) {
      if (!CLIENT_ID) return res.status(200).json({ configured: false });
      const state = crypto.randomBytes(16).toString('hex');
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(CLIENT_ID)}`
        + `&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=${encodeURIComponent('openid email profile')}`
        + `&state=${state}`;
      return res.status(200).json({ configured: true, url });
    }

    if (action === 'callback') {
      const code = req.query.code;
      if (!code || !CLIENT_ID) return res.status(400).send('Missing code or Google not configured');
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT, grant_type: 'authorization_code'
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) return res.status(400).send('Google token failed');
      const profRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const prof = await profRes.json();
      const email = (prof.email || '').toLowerCase();
      if (!email) return res.status(400).send('No email from Google');

      const exists = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      let row;
      if (exists.rows.length) {
        row = exists.rows[0];
        if (row.provider !== 'google') {
          await db.execute({ sql: 'UPDATE users SET provider = ?, picture = ?, name = ? WHERE id = ?', args: ['google', prof.picture, prof.name, row.id] });
        }
      } else {
        await db.execute({
          sql: 'INSERT INTO users (email, name, picture, provider, role) VALUES (?, ?, ?, ?, ?)',
          args: [email, prof.name, prof.picture, 'google', 'user']
        });
        const u = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
        row = u.rows[0];
      }
      const token = signSession({ id: Number(row.id), email: row.email, name: row.name, role: row.role, picture: row.picture });
      setSessionCookie(res, token);
      return res.redirect('/?loggedin=1');
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
