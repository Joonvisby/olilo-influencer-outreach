export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, shipping_address, instagram_handle, email, queue_kit } = req.body || {};
  if (!name || !shipping_address) {
    return res.status(400).json({ error: 'Name and shipping address are required' });
  }

  const AIRTABLE_TOKEN  = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE   = process.env.AIRTABLE_BASE_ID;
  const CREATORS_TABLE  = 'tblbBNgHxp6YNOJOQ';
  const SHIPMENTS_TABLE = 'tblGdJUGUXxFwHkKX';

  const ig = (instagram_handle || '').replace(/^@/, '').trim();
  const igHandle = ig ? `@${ig}` : '';
  const today = new Date().toISOString().split('T')[0];

  try {
    const fields = {
      Name: name,
      'Shipping Address': shipping_address,
      Status: 'Replied',
      Source: 'Manual Add',
      'Date Added': today,
    };
    if (igHandle) fields['Instagram Handle'] = igHandle;
    if (email) fields['Email'] = email;

    const createRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CREATORS_TABLE}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, typecast: true }),
      }
    );
    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error('create-creator failed:', createRes.status, createData);
      return res.status(500).json({ error: 'Failed to create creator' });
    }

    // Queue a kit shipment unless the caller opted out
    if (queue_kit !== false) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${SHIPMENTS_TABLE}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              Creator: [createData.id],
              'Request Date': today,
              Product: 'OLILO Sweet Fiber Syrup',
              Quantity: 1,
              'Shipping Address': shipping_address,
              Email: email || '',
              Status: 'Preparing',
              Notes: [
                `Name: ${name}`,
                email ? `Email: ${email}` : null,
                igHandle ? `Instagram: ${igHandle}` : null,
                `Ship to: ${shipping_address}`,
                'Source: Manual add (entered via admin)',
              ].filter(Boolean).join('\n'),
            },
          }),
        }
      );
    }

    return res.status(200).json({ ok: true, record: createData });
  } catch (err) {
    console.error('create-creator error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
