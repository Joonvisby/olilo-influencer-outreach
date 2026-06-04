export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const TABLE          = 'tblbBNgHxp6YNOJOQ'; // Creators

  try {
    let allRecords = [];
    let offset = '';

    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}?` +
        'fields[]=Name&fields[]=Instagram+Handle&fields[]=TikTok+Handle' +
        '&fields[]=Status&fields[]=Source&fields[]=Email&fields[]=Assigned+To&fields[]=Affiliate+Interest&fields[]=Outreach+Tier&fields[]=DM+Draft&fields[]=Email+Draft&fields[]=Last+Contacted+At&fields[]=Category&fields[]=Archived&fields[]=Date+Added&fields[]=Contacted+By&fields[]=Nurturing+Started' +
        '&sort[0][field]=Name&sort[0][direction]=asc' +
        (offset ? `&offset=${offset}` : '');

      const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const data = await resp.json();

      allRecords = allRecords.concat(data.records || []);
      offset = data.offset || '';
    } while (offset);

    // Single-table pipeline: the Creators table now also holds pre-live rows
    // (New / Enriching — awaiting the scout) and parked rows (Failed). Hide those
    // from every admin/kanban view. "Needs Review" rows are kept so the Review
    // tab can surface AI-scouted creators awaiting approval.
    const HIDDEN = new Set(['New', 'Enriching', 'Failed']);
    allRecords = allRecords.filter(r => !HIDDEN.has(r.fields.Status));

    // Derive per-channel contact state from the Outreach Log so the admin and
    // kanban views can show "by Email" / "by DM" without a schema change on
    // Creators. Each log row carries a Channel; Email → email, anything else
    // (Instagram DM / TikTok DM) → dm. We keep the latest date per channel.
    const OUTREACH_TABLE = 'tblwAnhjZ010eEIu6';
    const channelByCreator = {};
    try {
      let logOffset = '';
      do {
        const logUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}?` +
          'fields[]=Creator&fields[]=Date&fields[]=Channel' +
          (logOffset ? `&offset=${logOffset}` : '');
        const logResp = await fetch(logUrl, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
        const logData = await logResp.json();
        for (const row of logData.records || []) {
          const day = (row.fields.Date || '').split('T')[0];
          if (!day) continue;
          const key = row.fields.Channel === 'Email' ? 'email' : 'dm';
          for (const creatorId of (row.fields.Creator || [])) {
            const slot = channelByCreator[creatorId] || (channelByCreator[creatorId] = { email: null, dm: null });
            if (!slot[key] || day > slot[key]) slot[key] = day;
          }
        }
        logOffset = logData.offset || '';
      } while (logOffset);
    } catch (e) {
      console.error('creators: outreach log fetch failed', e);
    }
    for (const r of allRecords) {
      r.channels = channelByCreator[r.id] || { email: null, dm: null };
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ records: allRecords });
  } catch (err) {
    console.error('creators error:', err);
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
}
