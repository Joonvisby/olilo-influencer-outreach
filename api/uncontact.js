// api/uncontact.js — the inverse of api/contact.js.
// When a creator is reverted to "Not Contacted", delete every Outreach Log
// row linked to them so the log doesn't accumulate stale rows. Without this,
// re-contacting a reverted creator leaves the old log row behind, producing
// the duplicate Outreach Log entries we were seeing.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { recordId } = req.body || {};
  if (!recordId) return res.status(400).json({ error: 'Missing recordId' });

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const OUTREACH_TABLE = 'tblwAnhjZ010eEIu6';
  const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };

  try {
    // Linked-record fields come back as arrays of record IDs, so match on
    // includes() rather than a filterByFormula (which compares display names).
    const matching = [];
    let offset = '';
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}?fields[]=Creator` +
        (offset ? `&offset=${offset}` : '');
      const resp = await fetch(url, { headers });
      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: data });
      for (const r of data.records || []) {
        if ((r.fields.Creator || []).includes(recordId)) matching.push(r.id);
      }
      offset = data.offset || '';
    } while (offset);

    // Delete in batches of 10 (Airtable's per-request cap).
    let deleted = 0;
    for (let i = 0; i < matching.length; i += 10) {
      const batch = matching.slice(i, i + 10);
      const params = batch.map(id => `records[]=${encodeURIComponent(id)}`).join('&');
      const delResp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}?${params}`,
        { method: 'DELETE', headers }
      );
      if (!delResp.ok) {
        const e = await delResp.json().catch(() => ({}));
        return res.status(delResp.status).json({ error: e, deleted });
      }
      deleted += batch.length;
    }

    return res.status(200).json({ ok: true, deleted });
  } catch (err) {
    console.error('uncontact error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
