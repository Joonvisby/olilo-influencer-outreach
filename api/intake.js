export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, instagram_handle, tiktok_handle, shipping_address, affiliate_opt_in } = req.body;

  if (!name || !email || !instagram_handle || !shipping_address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const AIRTABLE_TOKEN  = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE   = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE  = process.env.AIRTABLE_TABLE_ID;
  const RESEND_API_KEY  = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL    = process.env.NOTIFY_EMAIL || 'joon@adaptive.kitchen';

  const igHandle = `@${instagram_handle}`;
  const igBare   = instagram_handle.replace(/^@/, '');

  try {
    // Search by Instagram handle (with or without @) OR name
    const safeName = name.replace(/"/g, '\\"');
    const formula = encodeURIComponent(
      `OR(LOWER({Instagram Handle})=LOWER("${igHandle}"),LOWER({Instagram Handle})=LOWER("${igBare}"),LOWER({Name})=LOWER("${safeName}"))`
    );
    const searchRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${formula}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    const searchData = await searchRes.json();

    let isNew = false;
    let recordId;

    if (searchData.records && searchData.records.length > 0) {
      // Update existing creator record
      recordId = searchData.records[0].id;
      const updateFields = {
        Email: email,
        'Phone': phone || '',
        'Shipping Address': shipping_address,
        Status: 'Replied',
        'Affiliate Interest': Boolean(affiliate_opt_in),
      };
      if (tiktok_handle) updateFields['TikTok Handle'] = `@${tiktok_handle}`;
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: updateFields }),
        }
      );

      // Update the most recent Outreach Log entry for this creator, if one exists
      const OUTREACH_TABLE = 'tblwAnhjZ010eEIu6';
      const logFormula = encodeURIComponent(`FIND("${recordId}", ARRAYJOIN({Creator}))`);
      const logRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}?filterByFormula=${logFormula}&sort[0][field]=Date&sort[0][direction]=desc&maxRecords=1`,
        { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      );
      const logData = await logRes.json();
      if (logData.records && logData.records.length > 0) {
        const logId = logData.records[0].id;
        await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE}/${OUTREACH_TABLE}/${logId}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                'Response Status': 'Positive',
                'Response Text': `Filled intake form. Ship to: ${shipping_address}`,
              },
            }),
          }
        );
      }
    } else {
      // No match — still capture them. Create a new confirmed creator record as Active
      // so they flow through to the admin page and kit queue instead of being dropped.
      isNew = true;
      const createFields = {
        Name: name,
        Email: email,
        'Phone': phone || '',
        'Instagram Handle': igHandle,
        'Shipping Address': shipping_address,
        Status: 'Not Contacted',
        Source: 'Inbound',
        'Affiliate Interest': Boolean(affiliate_opt_in),
      };
      if (tiktok_handle) createFields['TikTok Handle'] = `@${tiktok_handle}`;
      const createRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ typecast: true, fields: createFields }),
        }
      );
      const createData = await createRes.json();
      recordId = createData.id;
    }

    // Create a Shipments record for the kit queue (both matched and newly-created creators)
    if (recordId) {
      const SHIPMENTS_TABLE = 'tblGdJUGUXxFwHkKX';
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${SHIPMENTS_TABLE}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              Creator: [recordId],
              'Request Date': new Date().toISOString().split('T')[0],
              Product: 'OLILO Sweet Fiber Syrup',
              Quantity: 1,
              'Shipping Address': shipping_address,
              Email: email,
              Phone: phone || '',
              Status: 'Preparing',
              Notes: [
                `Name: ${name}`,
                `Email: ${email}`,
                `Phone: ${phone || '—'}`,
                `Instagram: ${igHandle}`,
                tiktok_handle ? `TikTok: @${tiktok_handle}` : null,
                `Ship to: ${shipping_address}`,
                `Affiliate Interest: ${affiliate_opt_in ? 'Yes' : 'No'}`,
              ].filter(Boolean).join('\n'),
            },
          }),
        }
      );
    }

    // Notify Joon via email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'OLILO Seeding <noreply@olilosweet.com>',
        to: [NOTIFY_EMAIL, 'rich@adaptive.kitchen'],
        subject: `${isNew ? '⚠️ New creator' : '✅ Kit requested'} — ${igHandle}`,
        html: buildEmail({ name, igHandle, tiktok_handle, email, phone, shipping_address, affiliate_opt_in, isNew }),
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('intake error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function buildEmail({ name, igHandle, tiktok_handle, email, phone, shipping_address, affiliate_opt_in, isNew }) {
  const flag = isNew
    ? '🆕 New creator — not on your outreach list. Created as Active + added to kit queue.'
    : '✅ Matched to existing record. Status → Replied.';
  const tdKey = 'padding:8px 0;border-bottom:1px solid #eee;font-weight:600;width:140px;vertical-align:top;';
  const tdVal = 'padding:8px 0;border-bottom:1px solid #eee;';
  const ttRow = tiktok_handle
    ? `<tr><td style="${tdKey}">TikTok</td><td style="${tdVal}">@${tiktok_handle}</td></tr>`
    : '';

  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#331B0A;padding:24px;">
  <h2 style="color:#FB4408;margin:0 0 4px;font-size:22px;">${igHandle}</h2>
  <p style="margin:0 0 8px;font-size:13px;color:#888;">${flag}</p>
  ${isNew ? `<p style="margin:0 0 20px;font-size:13px;color:#1e7d34;background:#f0fdf4;padding:10px 12px;border-radius:6px;line-height:1.5;">This person wasn't on your outreach list. They've been <strong>added to your Creators list as Active</strong> and queued for a kit. No action needed unless you want to remove them.</p>` : '<div style="margin-bottom:20px;"></div>'}
  <table style="width:100%;border-collapse:collapse;font-size:15px;">
    <tr><td style="${tdKey}">Name</td><td style="${tdVal}">${name}</td></tr>
    <tr><td style="${tdKey}">Email</td><td style="${tdVal}">${email}</td></tr>
    <tr><td style="${tdKey}">Phone</td><td style="${tdVal}">${phone || '—'}</td></tr>
    <tr><td style="${tdKey}">Instagram</td><td style="${tdVal}">${igHandle}</td></tr>
    ${ttRow}
    <tr><td style="${tdKey}">Ship to</td><td style="${tdVal}">${shipping_address}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Affiliate?</td><td style="padding:8px 0;">${affiliate_opt_in ? '✅ Yes — follow up after kit lands' : 'No'}</td></tr>
  </table>
  <p style="margin:28px 0 0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;">OLILO Seeding Platform · Kit queue</p>
</div>`;
}
