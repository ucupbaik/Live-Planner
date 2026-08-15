// Seed the Turso database with equipment data from equipment.json
// Run: node scripts/seed.mjs
// Requires env: TURSO_URL, TURSO_TOKEN
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;
if (!url || !token) {
  console.error('Missing TURSO_URL or TURSO_TOKEN env vars');
  process.exit(1);
}

const db = createClient({ url, authToken: token });

async function main() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      no INTEGER,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      img TEXT,
      emoji TEXT,
      has_settings INTEGER DEFAULT 0,
      inputs TEXT,   -- JSON array
      outputs TEXT,  -- JSON array
      func TEXT,
      ports_raw TEXT
    );
  `);

  const items = JSON.parse(readFileSync(join(ROOT, 'equipment.json'), 'utf-8'));
  console.log(`Seeding ${items.length} items...`);

  // Use a transaction for speed
  await db.batch(
    items.map((it) => ({
      sql: `INSERT OR REPLACE INTO equipment
            (id, no, name, brand, category, img, emoji, has_settings, inputs, outputs, func, ports_raw)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        it.id, it.no, it.name, it.brand, it.cat, it.img, it.emoji,
        it.hasSettings ? 1 : 0,
        JSON.stringify(it.inputs), JSON.stringify(it.outputs), it.func, it.ports_raw
      ],
    })),
    'write'
  );

  const res = await db.execute('SELECT COUNT(*) as c FROM equipment');
  console.log('Total rows in equipment:', res.rows[0].c);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
