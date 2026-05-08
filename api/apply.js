export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    country,
    primary_platform,
    instagram_handle,
    tiktok_handle,
    youtube_channel,
    audience_size,
    content_link,
    why_olilo,
  } = req.body;

  const ig = (instagram_handle || '').replace(/^@/, '').trim();
  const tt = (tiktok_handle || '').replace(/^@/, '').trim();
  const yt = (youtube_channel || '').trim();
  const hasHandle = ig || tt || yt;

  if (!name || !email || !country || !primary_platform || !audience_size || !content_link || !why_olilo || !hasHandle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const CREATORS_TABLE = process.env.AIRTABLE_TABLE_ID;
  const APPLICATIONS_TABLE = process.env.AIRTABLE_APPLICATIONS_TABLE_ID || 'tblY0ZCn5aqCnwUbz';
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL   = process.env.NOTIFY_EMAIL || 'joon@adaptive.kitchen';

  const igHandle = ig ? `@${ig}` : '';
  const ttHandle = tt ? `@${tt}` : '';

  try {
    let isDuplicate = false;
    let existingCreatorId = null;

    if (ig || email) {
      const safeEmail = email.replace(/"/g, '\\"');
      const conditions = [];
      if (ig) {
        conditions.push(`LOWER({Instagram Handle})=LOWER("@${ig}")`);
        conditions.push(`LOWER({Instagram Handle})=LOWER("${ig}")`);
      }
      if (email) conditions.push(`LOWER({Email})=LOWER("${safeEmail}")`);
      const formula = encodeURIComponent(`OR(${conditions.join(',')})`);

      const searchRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CREATORS_TABLE}?filterByFormula=${formula}&maxRecords=1`,
        { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      );
      const searchData = await searchRes.json();
      if (searchData.records && searchData.records.length > 0) {
        isDuplicate = true;
        existingCreatorId = searchData.records[0].id;
      }
    }

    if (!isDuplicate) {
      const today = new Date().toISOString().split('T')[0];
      const fields = {
        Name: name,
        'Application Date': today,
        Email: email,
        Country: country,
        'Primary Platform': primary_platform,
        'Audience Size': audience_size,
        'Content Link': content_link,
        'Why Olilo': why_olilo,
        Decision: 'Pending',
      };
      if (ig) fields['Instagram Handle'] = igHandle;
      if (tt) fields['TikTok Handle'] = ttHandle;
      if (yt) fields['YouTube Channel'] = yt;

      const createRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${APPLICATIONS_TABLE}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, typecast: true }),
        }
      );
      if (!createRes.ok) {
        const errBody = await createRes.text();
        console.error('Airtable create failed:', createRes.status, errBody);
        return res.status(500).json({ error: 'Failed to save application' });
      }
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'OLILO Applications <noreply@olilosweet.com>',
        to: [NOTIFY_EMAIL, 'rich@adaptive.kitchen'],
        subject: isDuplicate
          ? `⚠️ Self-apply from existing creator — ${igHandle || email}`
          : `📨 New creator application — ${igHandle || ttHandle || name}`,
        html: buildEmail({
          name, email, country, primary_platform,
          igHandle, ttHandle, yt,
          audience_size, content_link, why_olilo,
          isDuplicate, existingCreatorId, baseId: AIRTABLE_BASE, creatorsTable: CREATORS_TABLE,
        }),
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('apply error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function buildEmail({
  name, email, country, primary_platform,
  igHandle, ttHandle, yt,
  audience_size, content_link, why_olilo,
  isDuplicate, existingCreatorId, baseId, creatorsTable,
}) {
  const tdKey = 'padding:8px 0;border-bottom:1px solid #eee;font-weight:600;width:140px;vertical-align:top;';
  const tdVal = 'padding:8px 0;border-bottom:1px solid #eee;';
  const row = (k, v) => v ? `<tr><td style="${tdKey}">${k}</td><td style="${tdVal}">${v}</td></tr>` : '';
  const dupBanner = isDuplicate
    ? `<p style="margin:0 0 20px;font-size:13px;color:#92400e;background:#fffbeb;padding:10px 12px;border-radius:6px;line-height:1.5;">
        ⚠️ This applicant matched an existing record in <strong>Creators</strong>. <strong>No Applications row was created.</strong>
        Likely they filled out the wrong form — they should be using the kit confirmation link from your outreach email.
        <br><br>
        <a href="https://airtable.com/${baseId}/${creatorsTable}/${existingCreatorId}" style="color:#92400e;">Open existing creator record →</a>
      </p>`
    : `<p style="margin:0 0 20px;font-size:13px;color:#065f46;background:#ecfdf5;padding:10px 12px;border-radius:6px;line-height:1.5;">
        ✅ Application saved to Airtable. Decision = <strong>Pending</strong>. Review in the Applications table.
      </p>`;

  const headline = igHandle || ttHandle || name;
  const whyText = (why_olilo || '').replace(/\n/g, '<br>');

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#331B0A;padding:24px;">
  <h2 style="color:#FB4408;margin:0 0 4px;font-size:22px;">${headline}</h2>
  <p style="margin:0 0 16px;font-size:13px;color:#888;">${isDuplicate ? '⚠️ Existing creator — flagged' : 'New self-apply via /apply'}</p>
  ${dupBanner}
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${row('Name', name)}
    ${row('Email', email)}
    ${row('Country', country)}
    ${row('Platform', primary_platform)}
    ${row('Instagram', igHandle)}
    ${row('TikTok', ttHandle)}
    ${row('YouTube', yt ? `<a href="${yt}">${yt}</a>` : '')}
    ${row('Audience', audience_size)}
    ${row('Content', content_link ? `<a href="${content_link}">${content_link}</a>` : '')}
  </table>
  <div style="margin-top:18px;background:#fafafa;border-left:3px solid #FB4408;padding:12px 14px;border-radius:4px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:6px;">Why Olilo</div>
    <div style="font-size:14px;line-height:1.5;">${whyText}</div>
  </div>
  <p style="margin:28px 0 0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;">OLILO Seeding Platform · Inbound application</p>
</div>`;
}
