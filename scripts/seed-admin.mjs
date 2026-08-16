import { createClient } from '@libsql/client';
import crypto from 'crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env.vercel') });

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;
if (!url || !token) { console.error('TURSO not set'); process.exit(1); }

const db = createClient({ url, authToken: token });

const email = (process.argv[2] || 'admin@liveplanner.app').toLowerCase();
const name = process.argv[3] || 'Admin';
const password = process.argv[4] || 'admin123';
const hash = crypto.createHash('sha256').update(password + '::lp').digest('hex');

await db.execute(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE, name TEXT, picture TEXT,
  provider TEXT DEFAULT 'email', password TEXT, role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
)`);

const exists = await db.execute({ sql: 'SELECT id, role FROM users WHERE email = ?', args: [email] });
if (exists.rows.length) {
  await db.execute({ sql: "UPDATE users SET role = 'admin', password = ?, provider = 'email', name = ? WHERE email = ?", args: [hash, name, email] });
  console.log('Updated admin:', email, 'id=', exists.rows[0].id);
} else {
  const r = await db.execute({ sql: 'INSERT INTO users (email, name, provider, password, role) VALUES (?, ?, ?, ?, ?)', args: [email, name, 'email', hash, 'admin'] });
  console.log('Created admin:', email, 'id=', r.lastInsertRowid);
}
process.exit(0);
