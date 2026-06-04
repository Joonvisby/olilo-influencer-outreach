// Admin-only: capture a single Instagram handle into the Creators table as Status
// "New" (Source "Manual"). Dedups against the table first. Enrichment (DM draft,
// tier, etc.) happens later via the scout-creators skill, which flips New -> Not
// Contacted once done — no second table, no copy automation.
const CREATORS = 'tblbBNgHxp6YNOJOQ';

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
    // 1. Dedup — reject if this handle is already in the Creators table.
    const dedupUrl = `https://api.airtable.com/v0/${BASE}/${CREATORS}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields[]=Instagram+Handle`;
    const dr = await fetch(dedupUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const dd = await dr.json();
    if (dr.ok && Array.isArray(dd.records) && dd.records.length) {
      return res.status(409).json({ error: `@${clean} is already in your Creators list.`, where: 'confirmed' });
    }

    // 2. Create the New row in Creators, ready for the scout to enrich.
    const today = new Date().toISOString().split('T')[0];
    const create = await fetch(`https://api.airtable.com/v0/${BASE}/${CREATORS}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typecast: true,
        fields: {
          Name: clean,
          'Instagram Handle': clean,
          'Instagram Link': `https://instagram.com/${clean}`,
          Status: 'New',
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
