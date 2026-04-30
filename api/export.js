export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE     = process.env.AIRTABLE_BASE_ID;
  const SHIPMENTS_TABLE   = 'tblGdJUGUXxFwHkKX';
  const CREATORS_TABLE    = 'tblbBNgHxp6YNOJOQ';

  const statusFilter = req.query.status || 'Preparing';

  try {
    // Fetch shipments
    let shipments = [];
    let offset = '';
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${SHIPMENTS_TABLE}?` +
        `filterByFormula=${encodeURIComponent(`{Status}="${statusFilter}"`)}&` +
        'fields[]=Creator&fields[]=Request+Date&fields[]=Product&fields[]=Quantity' +
        '&fields[]=Shipping+Address&fields[]=Status&fields[]=Notes' +
        (offset ? `&offset=${offset}` : '');
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const data = await resp.json();
      shipments = shipments.concat(data.records || []);
      offset = data.offset || '';
    } while (offset);

    // Collect all creator record IDs to batch-fetch names
    const creatorIds = [...new Set(
      shipments.flatMap(s => s.fields.Creator || [])
    )];

    const creatorMap = {};
    if (creatorIds.length > 0) {
      const formula = `OR(${creatorIds.map(id => `RECORD_ID()="${id}"`).join(',')})`;
      const cUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CREATORS_TABLE}?` +
        `filterByFormula=${encodeURIComponent(formula)}&fields[]=Name&fields[]=Instagram+Handle&fields[]=Email&fields[]=Phone`;
      const cResp = await fetch(cUrl, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const cData = await cResp.json();
      (cData.records || []).forEach(r => { creatorMap[r.id] = r.fields; });
    }

    // Parse Notes field to extract individual values
    function parseNotes(notes) {
      const out = {};
      (notes || '').split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.slice(0, idx).trim();
          out[key] = line.slice(idx + 1).trim();
        }
      });
      return out;
    }

    // Build CSV rows
    const headers = ['Name','Email','Phone','Instagram','Ship To','Product','Quantity','Request Date','Affiliate Interest'];
    const rows = shipments.map(s => {
      const f = s.fields;
      const creatorId = (f.Creator || [])[0];
      const creator = creatorMap[creatorId] || {};
      const notes = parseNotes(f.Notes);

      const name      = notes['Name']      || creator.Name                  || '';
      const email     = notes['Email']     || creator.Email                 || '';
      const phone     = notes['Phone']     || creator.Phone                 || '';
      const instagram = notes['Instagram'] || creator['Instagram Handle']   || '';
      const address   = notes['Ship to']  || f['Shipping Address']         || '';
      const affiliate = notes['Affiliate Interest'] || '';

      return [name, email, phone, instagram, address, f.Product || 'Olilo Sweet Fiber Syrup', f.Quantity || 1, f['Request Date'] || '', affiliate];
    });

    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="olilo-kit-queue-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('export error:', err);
    return res.status(500).json({ error: 'Export failed' });
  }
}
