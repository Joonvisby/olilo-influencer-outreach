const ALLOWED_FIELDS = new Set(['Archived', 'Status', 'Last Contacted At', 'DM Draft']);
const VALID_STATUSES = new Set([
  'Not Contacted', 'Contacted', 'Replied', 'Deal Agreed',
  'Shipped', 'Delivered', 'Content Posted', 'Declined',
]);

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, fields } = req.body || {};
  if (!id || !fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'Missing id or fields' });
  }

  const safeFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.has(k)) safeFields[k] = v;
  }
  if (!Object.keys(safeFields).length) {
    return res.status(400).json({ error: 'No editable fields provided' });
  }
  if ('Status' in safeFields && !VALID_STATUSES.has(safeFields.Status)) {
    return res.status(400).json({ error: `Invalid status value: ${safeFields.Status}` });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const TABLE          = 'tblbBNgHxp6YNOJOQ';

  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: safeFields }),
      }
    );
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data });
    return res.status(200).json({ ok: true, record: data });
  } catch (err) {
    console.error('update-creator error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
