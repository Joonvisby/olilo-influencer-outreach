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
        '&fields[]=Status&fields[]=Email&fields[]=Assigned+To&fields[]=Affiliate+Interest&fields[]=Outreach+Tier&fields[]=DM+Draft&fields[]=Email+Draft&fields[]=Last+Contacted+At&fields[]=Category&fields[]=Archived&fields[]=Date+Added&fields[]=Contacted+By' +
        '&sort[0][field]=Name&sort[0][direction]=asc' +
        (offset ? `&offset=${offset}` : '');

      const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const data = await resp.json();

      allRecords = allRecords.concat(data.records || []);
      offset = data.offset || '';
    } while (offset);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ records: allRecords });
  } catch (err) {
    console.error('creators error:', err);
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
}
