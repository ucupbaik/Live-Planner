import { createClient } from '@libsql/client';

export function getDb() {
  const url = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;
  if (!url || !token) throw new Error('TURSO not configured');
  return createClient({ url, authToken: token });
}

export async function ensureSchema(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    provider TEXT DEFAULT 'email',
    password TEXT,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    title TEXT,
    module TEXT,
    data TEXT,
    is_public INTEGER DEFAULT 0,
    is_template INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    user_id INTEGER,
    text TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    data TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    no INTEGER,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    img TEXT,
    emoji TEXT,
    has_settings INTEGER DEFAULT 0,
    inputs TEXT,
    outputs TEXT,
    func TEXT,
    ports_raw TEXT
  )`);
}
