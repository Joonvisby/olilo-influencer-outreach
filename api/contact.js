export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recordId, channel, sentBy, notes } = req.body;
  if (!recordId || !channel) return res.status(400).json({ error: 'Missing recordId or channel' });

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE    = process.env.AIRTABLE_BASE_ID;
  const CREATORS_TABLE   = 'tblbBNgHxp6YNOJOQ';
  const OUTREACH_TABLE   = 'tblwAnhjZ010eEIu6';

  try {
    // 1. Update creator status → Contacted
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CREATORS_TABLE}/${recordId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Status: 'Contacted', 'Last Contacted At': new Date().toISOString().split('T')[0] } }),
      }
    );

    // 2. Create Outreach Log entry
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            Creator: [recordId],
            Date: new Date().toISOString(),
            Channel: channel,
            'Sent By': sentBy || 'Joon',
            'Message Sent': notes || '',
          },
        }),
      }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
