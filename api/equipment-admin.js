// Admin API for equipment: delete all, import CSV, export CSV
import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const token = process.env.TURSO_TOKEN;

export const config = { runtime: 'nodejs' };

function getDb() {
  if (!url || !token) throw new Error('TURSO not configured');
  return createClient({ url, authToken: token });
}

async function ensureEquipment(db) {
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

// Parse CSV text into array of row objects (handles quoted fields & commas)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toCSV(rows) {
  return rows.map(r => r.map(cell => {
    const s = String(cell == null ? '' : cell);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',')).join('\n');
}

// Convert a JSON array string (inputs/outputs) to a simple pipe-separated format for CSV
function portsToText(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr.map(p => `${p.name}|${p.type}`).join('; ');
}
function textToPorts(text) {
  if (!text || !text.trim()) return [];
  return text.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const [name, type] = s.split('|').map(x => x.trim());
    return { name: name || '', type: type || 'Other' };
  });
}

export default async function handler(req, res) {
  if (!url || !token) return res.status(500).json({ error: 'Turso not configured' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  try {
    await ensureEquipment(db);
    const { searchParams } = new URL(req.url, 'http://localhost');
    const action = searchParams.get('action');

    // DELETE ALL equipment
    if (req.method === 'DELETE' || action === 'delete-all') {
      await db.execute('DELETE FROM equipment');
      return res.status(200).json({ ok: true, deleted: true });
    }

    // EXPORT CSV
    if (req.method === 'GET' && action === 'export') {
      const result = await db.execute('SELECT * FROM equipment ORDER BY no ASC');
      const header = ['no', 'name', 'brand', 'category', 'img', 'emoji', 'has_settings', 'inputs', 'outputs', 'func', 'ports_raw'];
      const rows = [header];
      for (const r of result.rows) {
        rows.push([
          r.no, r.name, r.brand, r.category, r.img, r.emoji, r.has_settings ? 1 : 0,
          portsToText(JSON.parse(r.inputs || '[]')),
          portsToText(JSON.parse(r.outputs || '[]')),
          r.func, r.ports_raw
        ]);
      }
      const csv = toCSV(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="equipment-export.csv"');
      return res.status(200).send('\uFEFF' + csv);
    }

    // IMPORT CSV (POST with raw body)
    if (req.method === 'POST' && action === 'import') {
      let raw = '';
      if (typeof req.body === 'string') raw = req.body;
      else if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf-8');
      else if (req.body && req.body.csv) raw = req.body.csv;
      else {
        // read raw stream
        raw = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', c => data += c);
          req.on('end', () => resolve(data));
          req.on('error', reject);
        });
      }
      if (!raw || !raw.trim()) return res.status(400).json({ error: 'CSV kosong' });
      const rows = parseCSV(raw);
      if (rows.length < 2) return res.status(400).json({ error: 'CSV tidak punya baris data' });
      const header = rows[0].map(h => h.trim().toLowerCase());
      const idx = name => header.indexOf(name);
      const iNo = idx('no'), iName = idx('name'), iBrand = idx('brand'), iCat = idx('category'),
            iImg = idx('img'), iEmoji = idx('emoji'), iHas = idx('has_settings'),
            iIn = idx('inputs'), iOut = idx('outputs'), iFunc = idx('func'), iPorts = idx('ports_raw');

      let count = 0;
      const batch = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const name = (r[iName] || '').trim();
        if (!name) continue;
        const no = parseInt(r[iNo]) || (i);
        const brand = (r[iBrand] || '').trim();
        const category = (r[iCat] || 'Lainnya').trim();
        const img = (r[iImg] || '').trim();
        const emoji = (r[iEmoji] || '🔧').trim();
        const hasSettings = (r[iHas] || '').toString().trim() === '1' || /true/i.test(r[iHas] || '') ? 1 : 0;
        const inputs = textToPorts(r[iIn] || '');
        const outputs = textToPorts(r[iOut] || '');
        const func = (r[iFunc] || '').trim();
        const ports_raw = (r[iPorts] || '').trim();
        const id = `eq_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
        batch.push({
          sql: `INSERT OR REPLACE INTO equipment (id, no, name, brand, category, img, emoji, has_settings, inputs, outputs, func, ports_raw)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, no, name, brand, category, img, emoji, hasSettings,
                 JSON.stringify(inputs), JSON.stringify(outputs), func, ports_raw]
        });
        count++;
      }
      if (batch.length) await db.batch(batch, 'write');
      return res.status(200).json({ ok: true, imported: count });
    }

    // COUNT
    if (req.method === 'GET' && action === 'count') {
      const res2 = await db.execute('SELECT COUNT(*) as c FROM equipment');
      return res.status(200).json({ count: res2.rows[0].c });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
