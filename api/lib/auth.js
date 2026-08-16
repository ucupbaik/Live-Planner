import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'live-planner-secret-change-me';

export function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); }
  catch { return null; }
}

export function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `lp_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `lp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function getUser(req) {
  const cookies = parseCookies(req);
  return verifySession(cookies.lp_session);
}
