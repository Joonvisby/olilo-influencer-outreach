// Admin-only: capture a single Instagram handle into the "Creators (Manual)" staging
// table as Pending. Dedups against the confirmed list and both staging tables first.
// Enrichment (DM draft, tier, etc.) happens later via the scout-creators skill; once
// Enrichment Status flips to Done, an Airtable automation copies the row to Confirmed.
const TABLES = {
  confirmed:    'tblbBNgHxp6YNOJOQ',
  notConfirmed: 'tblUK3lHXp1h49PKd',
  manual:       'tbldVttdjmkcKEQ5z',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { handle, addedBy } = req.body || {};
  if (!handle || !String(handle).trim()) return res.status(400).json({ error: 'Missing handle' });
  const clean = String(handle).trim().replace(/^@+/, '').replace(/\s+/g, '');
  if (!clean) return res.status(400).json({ error: 'Invalid handle' });
  const by = addedBy === 'Rich' ? 'Rich' : 'Joon';

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE_ID;
  const lc = clean.toLowerCase();
  const formula = `LOWER(SUBSTITUTE({Instagram Handle},"@",""))="${lc}"`;

  try {
    // 1. Dedup — reject if this handle is already anywhere in the pipeline.
    for (const [label, tid] of Object.entries(TABLES)) {
      const url = `https://api.airtable.com/v0/${BASE}/${tid}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields[]=Instagram+Handle`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
      const d = await r.json();
      if (r.ok && Array.isArray(d.records) && d.records.length) {
        const where = label === 'confirmed' ? 'your live Creators list'
          : label === 'manual' ? 'the Manual queue'
          : 'the scouting list (not confirmed)';
        return res.status(409).json({ error: `@${clean} is already in ${where}.`, where: label });
      }
    }

    // 2. Create the Pending row in Creators (Manual).
    const today = new Date().toISOString().split('T')[0];
    const create = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLES.manual}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typecast: true,
        fields: {
          Name: clean,
          'Instagram Handle': clean,
          'Instagram Link': `https://instagram.com/${clean}`,
          'Fill Method': 'Manual',
          'Enrichment Status': 'Pending',
          'Assigned To': by,
          Source: 'Manual',
          'Date Added': today,
        },
      }),
    });
    const cdata = await create.json();
    if (!create.ok) return res.status(create.status).json({ error: cdata.error || 'Create failed' });
    return res.status(200).json({ ok: true, id: cdata.id, handle: clean, addedBy: by });
  } catch (err) {
    console.error('add-manual error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
