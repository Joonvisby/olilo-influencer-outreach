export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { recordId, status } = req.body;
  if (!recordId || !status) return res.status(400).json({ error: 'Missing recordId or status' });

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const TABLE          = 'tblbBNgHxp6YNOJOQ';

  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${recordId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Status: status } }),
      }
    );
    const data = await resp.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
